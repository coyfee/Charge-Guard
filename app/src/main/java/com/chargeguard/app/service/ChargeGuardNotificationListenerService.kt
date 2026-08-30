package com.chargeguard.app.service

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import com.chargeguard.app.ChargeGuardApplication
import com.chargeguard.app.data.local.entity.BillingFrequency
import com.chargeguard.app.data.local.entity.DetectionSource
import com.chargeguard.app.data.local.entity.SubscriptionEntity
import com.chargeguard.app.data.local.entity.SubscriptionStatus
import com.chargeguard.app.domain.parser.LocalSignalParser
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

class ChargeGuardNotificationListenerService : NotificationListenerService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        // Skip ChargeGuard's own notifications to avoid recursion
        if (sbn.packageName == packageName) return

        val extras = sbn.notification.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""

        val combinedContent = "$title $text $bigText $subText".trim()
        if (combinedContent.isBlank()) return

        // On-device privacy-preserving regex signal parser
        val parsed = LocalSignalParser.parse(combinedContent)
        if (!parsed.isIgnored && parsed.confidenceScore >= 50 && parsed.amount > 0) {
            handleDetectedSignal(parsed, combinedContent)
        }
    }

    private fun handleDetectedSignal(
        parsed: com.chargeguard.app.domain.parser.ParsedSignal,
        rawContent: String
    ) {
        serviceScope.launch {
            try {
                val repository = ChargeGuardApplication.instance.repository
                val database = ChargeGuardApplication.instance.database

                val existing = database.subscriptionDao().findByMerchant(parsed.merchantName)
                    ?: database.subscriptionDao().findByMerchant(parsed.normalizedName)

                if (existing != null) {
                    // Update existing subscription to avoid duplicate entries
                    val updated = existing.copy(
                        amount = parsed.amount,
                        currency = parsed.currency,
                        nextRenewalDate = parsed.renewalDateIso.ifEmpty { existing.nextRenewalDate },
                        confidence = maxOf(existing.confidence, parsed.confidenceScore),
                        notes = "Updated via on-device notification signal."
                    )
                    repository.updateAndReschedule(updated)
                } else {
                    val defaultRenewal = try {
                        LocalDate.now().plusMonths(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
                    } catch (e: Exception) {
                        "2026-09-30"
                    }

                    val newSub = SubscriptionEntity(
                        id = UUID.randomUUID().toString(),
                        merchantName = parsed.merchantName,
                        displayName = parsed.normalizedName,
                        category = detectCategory(parsed.normalizedName),
                        amount = parsed.amount,
                        currency = parsed.currency,
                        billingFrequency = BillingFrequency.MONTHLY,
                        nextRenewalDate = parsed.renewalDateIso.ifEmpty { defaultRenewal },
                        status = if (parsed.eventType == "TRIAL_END") SubscriptionStatus.TRIAL else SubscriptionStatus.CONFIRMED,
                        source = DetectionSource.NOTIFICATION,
                        confidence = parsed.confidenceScore,
                        isTrial = parsed.eventType == "TRIAL_END",
                        notes = "Auto-detected locally from notification: ${rawContent.take(100)}"
                    )
                    repository.insertAndSchedule(newSub)

                    // Post a local notification informing user that protection is active
                    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
                    val notify = NotificationCompat.Builder(this@ChargeGuardNotificationListenerService, ChargeGuardApplication.CHANNEL_ID_DETECTED)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle("ChargeGuard: ${parsed.normalizedName} Detected")
                        .setContentText("Scheduled renewal protection for ${parsed.currency} ${String.format("%.2f", parsed.amount)} (Confidence: ${parsed.confidenceScore}%)")
                        .setStyle(NotificationCompat.BigTextStyle().bigText("Identified recurring subscription signal from ${parsed.normalizedName}. Offline exact alarms are scheduled."))
                        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                        .setAutoCancel(true)
                        .build()
                    notificationManager.notify(newSub.id.hashCode(), notify)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun detectCategory(name: String): String {
        val lower = name.lowercase()
        return when {
            lower.contains("netflix") || lower.contains("spotify") || lower.contains("youtube") || lower.contains("disney") || lower.contains("hbo") || lower.contains("apple music") -> "Entertainment"
            lower.contains("chatgpt") || lower.contains("claude") || lower.contains("cursor") || lower.contains("openai") || lower.contains("midjourney") || lower.contains("github") -> "AI & Developer"
            lower.contains("google") || lower.contains("icloud") || lower.contains("dropbox") || lower.contains("drive") -> "Cloud Storage"
            lower.contains("canva") || lower.contains("adobe") || lower.contains("figma") || lower.contains("notion") -> "Productivity"
            else -> "Digital Services"
        }
    }
}

