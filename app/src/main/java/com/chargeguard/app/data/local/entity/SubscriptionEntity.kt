package com.chargeguard.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

enum class SubscriptionStatus { CONFIRMED, PREDICTED, TRIAL, CANCELLED, PAUSED }
enum class BillingFrequency { MONTHLY, YEARLY, WEEKLY, QUARTERLY, SEMI_ANNUALLY }
enum class DetectionSource { MANUAL, NOTIFICATION, EMAIL, SMS, CALENDAR, PREDICTION }

@Entity(
    tableName = "subscriptions",
    indices = [
        Index(value = ["merchantName"]),
        Index(value = ["nextRenewalDate"]),
        Index(value = ["status"])
    ]
)
data class SubscriptionEntity(
    @PrimaryKey
    val id: String,
    val merchantName: String,
    val displayName: String,
    val category: String,
    val amount: Double,
    val currency: String,
    val billingFrequency: BillingFrequency,
    val nextRenewalDate: String, // YYYY-MM-DD
    val lastRenewalDate: String? = null,
    val status: SubscriptionStatus,
    val source: DetectionSource,
    val confidence: Int, // 0 - 100
    val isPrediction: Boolean = false,
    val isTrial: Boolean = false,
    val trialEndsAt: String? = null,
    val previousAmount: Double? = null,
    val paymentMethodLast4: String? = null,
    val notes: String? = null,
    val enabledAlertTypes: String = "SEVEN_DAYS,THREE_DAYS,TWENTY_FOUR_HOURS", // Comma-separated
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
