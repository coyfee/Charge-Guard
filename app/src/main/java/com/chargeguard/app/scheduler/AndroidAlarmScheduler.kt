package com.chargeguard.app.scheduler

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.receiver.AlarmReceiver

interface AlarmScheduler {
    fun schedule(reminder: ReminderEntity)
    fun cancel(reminderId: String)
    fun rescheduleAll(reminders: List<ReminderEntity>)
}

class AndroidAlarmScheduler(private val context: Context) : AlarmScheduler {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    override fun schedule(reminder: ReminderEntity) {
        val now = System.currentTimeMillis()
        if (reminder.triggerTimeEpochMillis <= now || reminder.delivered || reminder.dismissed) {
            return
        }

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "com.chargeguard.app.ACTION_TRIGGER_REMINDER"
            putExtra("EXTRA_REMINDER_ID", reminder.id)
            putExtra("EXTRA_SUBSCRIPTION_ID", reminder.subscriptionId)
            putExtra("EXTRA_MERCHANT", reminder.merchantName)
            putExtra("EXTRA_TITLE", reminder.title)
            putExtra("EXTRA_BODY", reminder.body)
            putExtra("EXTRA_AMOUNT", reminder.amount)
            putExtra("EXTRA_CURRENCY", reminder.currency)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminder.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // OFFLINE GUARANTEE: Uses exact alarm allowing execution in Doze mode without network
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                reminder.triggerTimeEpochMillis,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                reminder.triggerTimeEpochMillis,
                pendingIntent
            )
        }
    }

    override fun cancel(reminderId: String) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "com.chargeguard.app.ACTION_TRIGGER_REMINDER"
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminderId.hashCode(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    override fun rescheduleAll(reminders: List<ReminderEntity>) {
        reminders.forEach { schedule(it) }
    }
}
