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
import java.util.UUID

class ChargeGuardNotificationListenerService : NotificationListenerService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val extras = sbn.notification.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""

        val combinedContent = "$title $text $bigText".trim()
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
                if (existing == null) {
                    val newSub = SubscriptionEntity(
                        id = UUID.randomUUID().toString(),
                        merchantName = parsed.merchantName,
                        displayName = parsed.normalizedName,
                        category = "Digital Services",
                        amount = parsed.amount,
                        currency = parsed.currency,
                        billingFrequency = BillingFrequency.MONTHLY,
                        nextRenewalDate = parsed.renewalDateIso.ifEmpty { "2026-09-15" },
                        status = if (parsed.eventType == "TRIAL_END") SubscriptionStatus.TRIAL else SubscriptionStatus.CONFIRMED,
                        source = DetectionSource.NOTIFICATION,
                        confidence = parsed.confidenceScore,
                        isTrial = parsed.eventType == "TRIAL_END",
                        notes = "Auto-detected locally from notification: ${rawContent.take(120)}"
                    )
                    repository.insertAndSchedule(newSub)

                    // Post a local notification informing user that protection is active
                    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
                    val notify = NotificationCompat.Builder(this@ChargeGuardNotificationListenerService, ChargeGuardApplication.CHANNEL_ID_DETECTED)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle("ChargeGuard Detected: ${parsed.normalizedName}")
                        .setContentText("Auto-scheduled renewal alarms for ${parsed.currency} ${parsed.amount} (Confidence: ${parsed.confidenceScore}%)")
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
}
