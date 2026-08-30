package com.chargeguard.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.chargeguard.app.data.local.ChargeGuardDatabase
import com.chargeguard.app.data.repository.SubscriptionRepository
import com.chargeguard.app.scheduler.AndroidAlarmScheduler

class ChargeGuardApplication : Application() {

    lateinit var database: ChargeGuardDatabase
        private set

    lateinit var alarmScheduler: AndroidAlarmScheduler
        private set

    lateinit var repository: SubscriptionRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize local SQLite Room database (100% offline)
        database = ChargeGuardDatabase.getInstance(this)

        // Initialize offline AlarmManager scheduler
        alarmScheduler = AndroidAlarmScheduler(this)

        // Initialize offline repository
        repository = SubscriptionRepository(database.subscriptionDao(), database.reminderDao(), alarmScheduler)

        // Create notification channels for subscription renewal warnings
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = "Subscription Renewal Warnings"
            val channelDescription = "Alerts before recurring subscription charges occur (7 days, 3 days, 24h, 1h)"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID_RENEWALS, channelName, importance).apply {
                description = channelDescription
                enableVibration(true)
            }

            val detectedChannel = NotificationChannel(
                CHANNEL_ID_DETECTED,
                "Subscription Signal Detections",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifies when on-device SMS/Notification parser identifies a subscription"
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
            notificationManager.createNotificationChannel(detectedChannel)
        }
    }

    companion object {
        const val CHANNEL_ID_RENEWALS = "chargeguard_renewals_channel"
        const val CHANNEL_ID_DETECTED = "chargeguard_detected_channel"
        lateinit var instance: ChargeGuardApplication
            private set
    }
}
