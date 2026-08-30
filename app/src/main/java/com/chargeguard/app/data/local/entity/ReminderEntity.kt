package com.chargeguard.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

enum class ReminderType {
    SEVEN_DAYS,
    THREE_DAYS,
    TWENTY_FOUR_HOURS,
    ONE_HOUR,
    DAY_OF,
    CUSTOM
}

@Entity(
    tableName = "reminders",
    foreignKeys = [
        ForeignKey(
            entity = SubscriptionEntity::class,
            parentColumns = ["id"],
            childColumns = ["subscriptionId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["subscriptionId"]),
        Index(value = ["triggerTimeEpochMillis"]),
        Index(value = ["scheduled", "delivered"])
    ]
)
data class ReminderEntity(
    @PrimaryKey
    val id: String,
    val subscriptionId: String,
    val triggerTimeEpochMillis: Long,
    val reminderType: ReminderType,
    val scheduled: Boolean = true,
    val delivered: Boolean = false,
    val dismissed: Boolean = false,
    val title: String,
    val body: String,
    val amount: Double,
    val currency: String,
    val merchantName: String,
    val createdAt: Long = System.currentTimeMillis()
)
