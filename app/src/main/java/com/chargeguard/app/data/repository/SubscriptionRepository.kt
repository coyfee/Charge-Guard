package com.chargeguard.app.data.repository

import com.chargeguard.app.data.local.dao.ReminderDao
import com.chargeguard.app.data.local.dao.SubscriptionDao
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.data.local.entity.ReminderType
import com.chargeguard.app.data.local.entity.SubscriptionEntity
import com.chargeguard.app.scheduler.AlertOffset
import com.chargeguard.app.scheduler.AndroidAlarmScheduler
import com.chargeguard.app.scheduler.ReminderTimeCalculator
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class SubscriptionRepository(
    private val subscriptionDao: SubscriptionDao,
    private val reminderDao: ReminderDao,
    private val alarmScheduler: AndroidAlarmScheduler
) {

    fun getAllSubscriptionsFlow(): Flow<List<SubscriptionEntity>> = subscriptionDao.getAllSubscriptionsFlow()

    fun getAllRemindersFlow(): Flow<List<ReminderEntity>> = reminderDao.getAllRemindersFlow()

    suspend fun getSubscriptionById(id: String): SubscriptionEntity? = subscriptionDao.getById(id)

    suspend fun insertAndSchedule(subscription: SubscriptionEntity) {
        subscriptionDao.insertSubscription(subscription)
        generateAndScheduleReminders(subscription)
    }

    suspend fun updateAndReschedule(subscription: SubscriptionEntity) {
        subscriptionDao.updateSubscription(subscription)
        generateAndScheduleReminders(subscription)
    }

    suspend fun deleteSubscription(subscriptionId: String) {
        val existingReminders = reminderDao.getRemindersForSubscription(subscriptionId)
        existingReminders.forEach { reminder ->
            alarmScheduler.cancel(reminder.id)
        }
        reminderDao.deleteForSubscription(subscriptionId)
        subscriptionDao.deleteById(subscriptionId)
    }

    suspend fun dismissReminder(reminderId: String) {
        alarmScheduler.cancel(reminderId)
        reminderDao.dismissReminder(reminderId)
    }

    suspend fun testTriggerReminder(reminder: ReminderEntity) {
        alarmScheduler.triggerImmediately(reminder)
    }

    suspend fun rescheduleAllAlarms() {
        val now = System.currentTimeMillis()
        val pendingReminders = reminderDao.getPendingReminders(now)
        alarmScheduler.rescheduleAll(pendingReminders)
    }

    private suspend fun generateAndScheduleReminders(subscription: SubscriptionEntity) {
        // Clear previous reminders for this subscription
        val previousReminders = reminderDao.getRemindersForSubscription(subscription.id)
        previousReminders.forEach { alarmScheduler.cancel(it.id) }
        reminderDao.deleteForSubscription(subscription.id)

        val remindersToCreate = mutableListOf<ReminderEntity>()

        // 1. 7 days before
        val sevenDaysEpoch = ReminderTimeCalculator.calculateTriggerEpochMillis(
            subscription.nextRenewalDate,
            AlertOffset.SEVEN_DAYS
        )
        if (ReminderTimeCalculator.isSchedulable(sevenDaysEpoch)) {
            remindersToCreate.add(
                ReminderEntity(
                    id = UUID.randomUUID().toString(),
                    subscriptionId = subscription.id,
                    triggerTimeEpochMillis = sevenDaysEpoch,
                    reminderType = ReminderType.SEVEN_DAYS,
                    title = "Upcoming Renewal: ${subscription.displayName}",
                    body = "${subscription.displayName} renews in 7 days for ${subscription.currency} ${subscription.amount}.",
                    amount = subscription.amount,
                    currency = subscription.currency,
                    merchantName = subscription.merchantName
                )
            )
        }

        // 2. 3 days before
        val threeDaysEpoch = ReminderTimeCalculator.calculateTriggerEpochMillis(
            subscription.nextRenewalDate,
            AlertOffset.THREE_DAYS
        )
        if (ReminderTimeCalculator.isSchedulable(threeDaysEpoch)) {
            remindersToCreate.add(
                ReminderEntity(
                    id = UUID.randomUUID().toString(),
                    subscriptionId = subscription.id,
                    triggerTimeEpochMillis = threeDaysEpoch,
                    reminderType = ReminderType.THREE_DAYS,
                    title = "Reminder: ${subscription.displayName} in 3 Days",
                    body = "Scheduled renewal of ${subscription.currency} ${subscription.amount} is 3 days away.",
                    amount = subscription.amount,
                    currency = subscription.currency,
                    merchantName = subscription.merchantName
                )
            )
        }

        // 3. 24 hours before (9:00 AM day before)
        val oneDayEpoch = ReminderTimeCalculator.calculateTriggerEpochMillis(
            subscription.nextRenewalDate,
            AlertOffset.TWENTY_FOUR_HOURS
        )
        if (ReminderTimeCalculator.isSchedulable(oneDayEpoch)) {
            remindersToCreate.add(
                ReminderEntity(
                    id = UUID.randomUUID().toString(),
                    subscriptionId = subscription.id,
                    triggerTimeEpochMillis = oneDayEpoch,
                    reminderType = ReminderType.TWENTY_FOUR_HOURS,
                    title = "Tomorrow: ${subscription.displayName} Renews",
                    body = "Final 24-hour reminder: ${subscription.displayName} will be charged ${subscription.currency} ${subscription.amount} tomorrow.",
                    amount = subscription.amount,
                    currency = subscription.currency,
                    merchantName = subscription.merchantName
                )
            )
        }

        // 4. Same Day Morning (8:00 AM on renewal day)
        val sameDayEpoch = ReminderTimeCalculator.calculateTriggerEpochMillis(
            subscription.nextRenewalDate,
            AlertOffset.SAME_DAY_MORNING
        )
        if (ReminderTimeCalculator.isSchedulable(sameDayEpoch)) {
            remindersToCreate.add(
                ReminderEntity(
                    id = UUID.randomUUID().toString(),
                    subscriptionId = subscription.id,
                    triggerTimeEpochMillis = sameDayEpoch,
                    reminderType = ReminderType.SAME_DAY,
                    title = "Today: ${subscription.displayName} Charges",
                    body = "Payment of ${subscription.currency} ${subscription.amount} for ${subscription.displayName} is scheduled for today.",
                    amount = subscription.amount,
                    currency = subscription.currency,
                    merchantName = subscription.merchantName
                )
            )
        }

        // 5. Imminent Fallback (if renewal is within 24h and scheduled morning alarms have already passed)
        if (remindersToCreate.isEmpty()) {
            val urgentEpoch = System.currentTimeMillis() + 60_000L // 1 minute from now
            remindersToCreate.add(
                ReminderEntity(
                    id = UUID.randomUUID().toString(),
                    subscriptionId = subscription.id,
                    triggerTimeEpochMillis = urgentEpoch,
                    reminderType = ReminderType.CUSTOM,
                    title = "Urgent: ${subscription.displayName} Renews Soon",
                    body = "${subscription.displayName} renews on ${subscription.nextRenewalDate} (${subscription.currency} ${subscription.amount}). Exact protection active.",
                    amount = subscription.amount,
                    currency = subscription.currency,
                    merchantName = subscription.merchantName
                )
            )
        }

        // Save & schedule each alarm in Android AlarmManager
        if (remindersToCreate.isNotEmpty()) {
            reminderDao.insertReminders(remindersToCreate)
            remindersToCreate.forEach { reminder ->
                alarmScheduler.schedule(reminder)
            }
        }
    }
}

