package com.chargeguard.app.data.local.dao

import androidx.room.*
import com.chargeguard.app.data.local.entity.ReminderEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ReminderDao {

    @Query("SELECT * FROM reminders ORDER BY triggerTimeEpochMillis ASC")
    fun getAllRemindersFlow(): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminders WHERE triggerTimeEpochMillis >= :now AND dismissed = 0 ORDER BY triggerTimeEpochMillis ASC")
    suspend fun getPendingReminders(now: Long = System.currentTimeMillis()): List<ReminderEntity>

    @Query("SELECT * FROM reminders WHERE subscriptionId = :subscriptionId")
    suspend fun getRemindersForSubscription(subscriptionId: String): List<ReminderEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReminder(reminder: ReminderEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReminders(reminders: List<ReminderEntity>)

    @Query("UPDATE reminders SET delivered = 1 WHERE id = :id")
    suspend fun markDelivered(id: String)

    @Query("UPDATE reminders SET dismissed = 1 WHERE id = :id")
    suspend fun markDismissed(id: String)

    @Query("DELETE FROM reminders WHERE subscriptionId = :subscriptionId")
    suspend fun deleteForSubscription(subscriptionId: String)

    @Query("DELETE FROM reminders WHERE id = :id")
    suspend fun deleteById(id: String)
}
