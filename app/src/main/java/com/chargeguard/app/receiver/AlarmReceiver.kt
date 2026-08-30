package com.chargeguard.app.receiver

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.chargeguard.app.ChargeGuardApplication
import com.chargeguard.app.presentation.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "com.chargeguard.app.ACTION_TRIGGER_REMINDER") {
            val reminderId = intent.getStringExtra("EXTRA_REMINDER_ID") ?: return
            val merchant = intent.getStringExtra("EXTRA_MERCHANT") ?: "Subscription"
            val title = intent.getStringExtra("EXTRA_TITLE") ?: "Subscription Reminder"
            val body = intent.getStringExtra("EXTRA_BODY") ?: "Upcoming subscription charge detected."
            val amount = intent.getDoubleExtra("EXTRA_AMOUNT", 0.0)
            val currency = intent.getStringExtra("EXTRA_CURRENCY") ?: "PHP"

            // Build full screen notification with intent to open app
            val contentIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingContentIntent = PendingIntent.getActivity(
                context,
                reminderId.hashCode(),
                contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, ChargeGuardApplication.CHANNEL_ID_RENEWALS)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingContentIntent)
                .setAutoCancel(true)
                .build()

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(reminderId.hashCode(), notification)

            // Mark delivered in local database
            val pendingResult = goAsync()
            val database = ChargeGuardApplication.instance.database
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    database.reminderDao().markDelivered(reminderId)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
