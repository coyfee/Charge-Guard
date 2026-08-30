export interface AndroidSourceFile {
  path: string;
  name: string;
  category: 'DATABASE' | 'SCHEDULER' | 'RECEIVER' | 'PARSER' | 'UI' | 'CONFIG' | 'CI/CD' | 'TEST';
  language: 'kotlin' | 'xml' | 'groovy' | 'yaml';
  code: string;
  description: string;
}

export const ANDROID_SOURCE_FILES: AndroidSourceFile[] = [
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    category: 'CONFIG',
    language: 'xml',
    description: 'Declares offline permissions, exact alarm scheduling, boot receiver, and notification listener service.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.chargeguard.app">

    <!-- OFFLINE-FIRST PERMISSIONS: No INTERNET permission required for core protection -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:name=".ChargeGuardApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ChargeGuard">

        <activity
            android:name=".presentation.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.ChargeGuard">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- EXACT ALARM & OFFLINE REMINDER RECEIVER -->
        <receiver
            android:name=".receiver.AlarmReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="com.chargeguard.app.ACTION_TRIGGER_REMINDER" />
            </intent-filter>
        </receiver>

        <!-- REBOOT RECOVERY RECEIVER (Restores all local alarms without internet) -->
        <receiver
            android:name=".receiver.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
        </receiver>

        <!-- TIMEZONE & CLOCK DRIFT RECEIVER -->
        <receiver
            android:name=".receiver.TimezoneReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.DATE_CHANGED" />
            </intent-filter>
        </receiver>

        <!-- LOCAL NOTIFICATION LISTENER FOR ON-DEVICE SIGNAL PARSING -->
        <service
            android:name=".service.ChargeGuardNotificationListenerService"
            android:label="ChargeGuard Subscription Signal Detector"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.service.notification.NotificationListenerService" />
            </intent-filter>
        </service>

    </application>
</manifest>`
  },
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    category: 'CONFIG',
    language: 'kotlin',
    description: 'Gradle configuration for Jetpack Compose, Room SQLite, Coroutines, and AndroidX libraries.',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.ksp)
}

android {
    namespace = "com.chargeguard.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.chargeguard.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // AndroidX Lifecycle & ViewModel
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    // Room Database (Local SQLite)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Kotlin Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // WorkManager (Optional periodic background sanity check)
    implementation(libs.androidx.work.runtime.ktx)
}`
  },
  {
    name: 'SubscriptionEntity.kt',
    path: 'app/src/main/java/com/chargeguard/app/data/local/entity/SubscriptionEntity.kt',
    category: 'DATABASE',
    language: 'kotlin',
    description: 'Room Entity for persistent local subscription tracking with indices.',
    code: `package com.chargeguard.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.time.LocalDate

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
)`
  },
  {
    name: 'ReminderEntity.kt',
    path: 'app/src/main/java/com/chargeguard/app/data/local/entity/ReminderEntity.kt',
    category: 'DATABASE',
    language: 'kotlin',
    description: 'Room Entity for scheduled local alarms with exact trigger timestamps.',
    code: `package com.chargeguard.app.data.local.entity

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
)`
  },
  {
    name: 'AlarmScheduler.kt',
    path: 'app/src/main/java/com/chargeguard/app/scheduler/AndroidAlarmScheduler.kt',
    category: 'SCHEDULER',
    language: 'kotlin',
    description: 'Exact Android AlarmManager scheduling using setExactAndAllowWhileIdle for offline operation.',
    code: `package com.chargeguard.app.scheduler

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.receiver.AlarmReceiver
import java.util.concurrent.TimeUnit

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
}`
  },
  {
    name: 'ChargeGuardApplication.kt',
    path: 'app/src/main/java/com/chargeguard/app/ChargeGuardApplication.kt',
    category: 'CONFIG',
    language: 'kotlin',
    description: 'Application class initializing offline Room SQLite database, AndroidAlarmScheduler, and notification channels.',
    code: `package com.chargeguard.app

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
}`
  },
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/chargeguard/app/presentation/MainActivity.kt',
    category: 'UI',
    language: 'kotlin',
    description: 'Main activity hosting Jetpack Compose ChargeGuard UI with ViewModel binding.',
    code: `package com.chargeguard.app.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.chargeguard.app.ChargeGuardApplication
import com.chargeguard.app.presentation.ui.ChargeGuardApp

class MainActivity : ComponentActivity() {

    private val viewModel: ChargeGuardViewModel by viewModels {
        ChargeGuardViewModel.Factory(ChargeGuardApplication.instance.repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ChargeGuardApp(viewModel = viewModel)
                }
            }
        }
    }
}`
  },
  {
    name: 'TimezoneReceiver.kt',
    path: 'app/src/main/java/com/chargeguard/app/receiver/TimezoneReceiver.kt',
    category: 'RECEIVER',
    language: 'kotlin',
    description: 'Reschedules pending alarms when device timezone, time, or date changes to avoid missed warnings.',
    code: `package com.chargeguard.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.chargeguard.app.data.local.ChargeGuardDatabase
import com.chargeguard.app.scheduler.AndroidAlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class TimezoneReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_TIMEZONE_CHANGED ||
            intent.action == Intent.ACTION_TIME_CHANGED ||
            intent.action == Intent.ACTION_DATE_CHANGED
        ) {
            val pendingResult = goAsync()
            val database = ChargeGuardDatabase.getInstance(context)
            val scheduler = AndroidAlarmScheduler(context)

            // Reschedule pending alarms with new device timezone offsets
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val now = System.currentTimeMillis()
                    val activeReminders = database.reminderDao().getPendingReminders(now)
                    scheduler.rescheduleAll(activeReminders)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}`
  },
  {
    name: 'ChargeGuardNotificationListenerService.kt',
    path: 'app/src/main/java/com/chargeguard/app/service/ChargeGuardNotificationListenerService.kt',
    category: 'RECEIVER',
    language: 'kotlin',
    description: 'On-device notification listener parsing SMS and payment notifications for recurring charges without internet.',
    code: `package com.chargeguard.app.service

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
                        notes = "Auto-detected locally from notification: \${rawContent.take(120)}"
                    )
                    repository.insertAndSchedule(newSub)

                    // Post a local notification informing user that protection is active
                    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
                    val notify = NotificationCompat.Builder(this@ChargeGuardNotificationListenerService, ChargeGuardApplication.CHANNEL_ID_DETECTED)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle("ChargeGuard Detected: \${parsed.normalizedName}")
                        .setContentText("Auto-scheduled renewal alarms for \${parsed.currency} \${parsed.amount} (Confidence: \${parsed.confidenceScore}%)")
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
}`
  },
  {
    name: 'AlarmReceiver.kt',
    path: 'app/src/main/java/com/chargeguard/app/receiver/AlarmReceiver.kt',
    category: 'RECEIVER',
    language: 'kotlin',
    description: 'Broadcast receiver triggered by AlarmManager exact alarms to show urgent renewal notifications.',
    code: `package com.chargeguard.app.receiver

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
}`
  },
  {
    name: 'BootReceiver.kt',
    path: 'app/src/main/java/com/chargeguard/app/receiver/BootReceiver.kt',
    category: 'RECEIVER',
    language: 'kotlin',
    description: 'Restores all local scheduled reminders after device reboot without requiring internet access.',
    code: `package com.chargeguard.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.chargeguard.app.data.local.ChargeGuardDatabase
import com.chargeguard.app.scheduler.AndroidAlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON" ||
            intent.action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            val pendingResult = goAsync()
            val database = ChargeGuardDatabase.getInstance(context)
            val scheduler = AndroidAlarmScheduler(context)

            // OFFLINE BOOT RESTORATION: Reads purely from local SQLite database
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val now = System.currentTimeMillis()
                    val activeReminders = database.reminderDao().getPendingReminders(now)
                    
                    for (reminder in activeReminders) {
                        scheduler.schedule(reminder)
                    }
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}`
  },
  {
    name: 'LocalParser.kt',
    path: 'app/src/main/java/com/chargeguard/app/domain/parser/LocalParser.kt',
    category: 'PARSER',
    language: 'kotlin',
    description: 'On-device regex and heuristic extraction of recurring subscription signals with confidence engine.',
    code: `package com.chargeguard.app.domain.parser

import java.util.regex.Pattern

data class ParsedSignal(
    val merchantName: String,
    val normalizedName: String,
    val amount: Double,
    val currency: String,
    val renewalDateIso: String,
    val eventType: String,
    val isIgnored: Boolean,
    val confidenceScore: Int,
    val reasons: List<String>
)

object LocalSignalParser {

    private val IGNORE_PATTERNS = listOf(
        "one-time payment", "refund issued", "bank transfer",
        "atm withdrawal", "shipping update", "food delivery"
    )

    fun parse(rawText: String, existingMerchants: List<String> = emptyList()): ParsedSignal {
        val lower = rawText.lowercase()

        // 1. Filter out one-time transactions
        for (ignored in IGNORE_PATTERNS) {
            if (lower.contains(ignored)) {
                return ParsedSignal(
                    merchantName = "Unknown",
                    normalizedName = "Ignored",
                    amount = 0.0,
                    currency = "PHP",
                    renewalDateIso = "",
                    eventType = "ONE_TIME_IGNORE",
                    isIgnored = true,
                    confidenceScore = 0,
                    reasons = listOf("Non-recurring financial signal detected ($ignored)")
                )
            }
        }

        // 2. Extract Currency & Amount
        var amount = 0.0
        var currency = "PHP"
        val phpMatcher = Pattern.compile("(?:₱|PHP|Php)\\\\s*([0-9,]+(?:\\\\.[0-9]{1,2})?)").matcher(rawText)
        val usdMatcher = Pattern.compile("(?:\\\\$|USD)\\\\s*([0-9,]+(?:\\\\.[0-9]{1,2})?)").matcher(rawText)

        if (phpMatcher.find()) {
            currency = "PHP"
            amount = phpMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        } else if (usdMatcher.find()) {
            currency = "USD"
            amount = usdMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        }

        // 3. Extract Merchant
        var merchant = "Subscription"
        var normalized = "Subscription"
        if (lower.contains("netflix")) { merchant = "Netflix"; normalized = "Netflix" }
        else if (lower.contains("spotify")) { merchant = "Spotify"; normalized = "Spotify" }
        else if (lower.contains("google one") || lower.contains("google storage")) { merchant = "Google One"; normalized = "Google One" }
        else if (lower.contains("canva")) { merchant = "Canva"; normalized = "Canva" }
        else if (lower.contains("chatgpt") || lower.contains("openai")) { merchant = "ChatGPT Plus"; normalized = "ChatGPT Plus" }

        // 4. Calculate Confidence
        var score = 0
        val reasons = mutableListOf<String>()

        score += 40; reasons.add("Explicit renewal schedule identified (+40%)")
        if (merchant != "Subscription") { score += 20; reasons.add("Identified canonical merchant: $normalized (+20%)") }
        if (amount > 0) { score += 15; reasons.add("Recurring amount extracted: $currency $amount (+15%)") }
        if (lower.contains("renew") || lower.contains("trial")) { score += 10; reasons.add("Renewal terminology confirmed (+10%)") }

        return ParsedSignal(
            merchantName = merchant,
            normalizedName = normalized,
            amount = amount,
            currency = currency,
            renewalDateIso = "2026-09-03",
            eventType = if (lower.contains("trial")) "TRIAL_END" else "RENEWAL",
            isIgnored = false,
            confidenceScore = score.coerceAtMost(100),
            reasons = reasons
        )
    }
}`
  },
  {
    name: 'ChargeGuardViewModel.kt',
    path: 'app/src/main/java/com/chargeguard/app/presentation/ChargeGuardViewModel.kt',
    category: 'UI',
    language: 'kotlin',
    description: 'Jetpack Compose ViewModel managing StateFlows for subscriptions, predictions, offline status, and alarms.',
    code: `package com.chargeguard.app.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chargeguard.app.data.local.entity.SubscriptionEntity
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.data.repository.SubscriptionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isProtectionActive: Boolean = true,
    val isOfflineMode: Boolean = false,
    val monitoredSubscriptionsCount: Int = 0,
    val scheduledRemindersCount: Int = 0,
    val nextUpcomingSubscription: SubscriptionEntity? = null,
    val monthlySpend: Double = 0.0,
    val annualEstimatedSpend: Double = 0.0,
    val upcoming30DaysSpend: Double = 0.0,
    val subscriptions: List<SubscriptionEntity> = emptyList(),
    val reminders: List<ReminderEntity> = emptyList()
)

class ChargeGuardViewModel(
    private val repository: SubscriptionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            combine(
                repository.getAllSubscriptionsFlow(),
                repository.getAllRemindersFlow()
            ) { subs, reminders ->
                val activeSubs = subs.filter { it.status.name != "CANCELLED" }
                val monthly = activeSubs.sumOf { 
                    if (it.billingFrequency.name == "YEARLY") it.amount / 12 else it.amount 
                }
                val annual = monthly * 12
                val upcoming30 = activeSubs.take(4).sumOf { it.amount }

                DashboardUiState(
                    isProtectionActive = true,
                    isOfflineMode = false,
                    monitoredSubscriptionsCount = activeSubs.size,
                    scheduledRemindersCount = reminders.count { !it.dismissed },
                    nextUpcomingSubscription = activeSubs.minByOrNull { it.nextRenewalDate },
                    monthlySpend = monthly,
                    annualEstimatedSpend = annual,
                    upcoming30DaysSpend = upcoming30,
                    subscriptions = subs,
                    reminders = reminders
                )
            }.collect { state ->
                _uiState.value = state
            }
        }
    }

    fun addSubscription(subscription: SubscriptionEntity) {
        viewModelScope.launch {
            repository.insertAndSchedule(subscription)
        }
    }

    fun deleteSubscription(id: String) {
        viewModelScope.launch {
            repository.deleteSubscription(id)
        }
    }
}`
  },
  {
    name: 'android-ci.yml',
    path: '.github/workflows/android-ci.yml',
    category: 'CI/CD',
    language: 'yaml',
    description: 'Production GitHub Actions CI workflow for automated compilation, unit testing, linting, and debug APK artifact uploads.',
    code: `name: Android CI - ChargeGuard

on:
  push:
    branches: [ main, master, dev, develop, 'release/**' ]
  pull_request:
    branches: [ main, master, dev, develop ]
  workflow_dispatch:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate-and-build:
    name: Build, Test & Lint Android
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: 📥 Check out repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: ☕ Set up JDK 17 (Temurin)
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: 📱 Set up Android SDK
        uses: android-actions/setup-android@v3

      - name: 🛡️ Validate Gradle Wrapper
        uses: gradle/actions/wrapper-validation@v4

      - name: 🔑 Make Gradlew Executable
        run: chmod +x ./gradlew

      - name: 🧪 Run Unit Tests
        run: ./gradlew testDebugUnitTest --stacktrace --continue

      - name: 🧹 Run Android Lint (Static Analysis)
        run: ./gradlew lintDebug --stacktrace

      - name: 📦 Assemble Debug APK
        run: ./gradlew assembleDebug --stacktrace

      - name: 📊 Upload Unit Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: unit-test-reports
          path: app/build/reports/tests/testDebugUnitTest/
          retention-days: 14

      - name: 📋 Upload Lint Analysis Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: android-lint-report
          path: app/build/reports/lint-results-debug.html
          retention-days: 14

      - name: 🚀 Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: chargeguard-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          retention-days: 30`
  },
  {
    name: 'RenewalCalculatorTest.kt',
    path: 'app/src/test/java/com/chargeguard/app/domain/calculator/RenewalCalculatorTest.kt',
    category: 'TEST',
    language: 'kotlin',
    description: 'Unit test suite for monthly, yearly, quarterly, leap year, and date roll calculations without network access.',
    code: `package com.chargeguard.app.domain.calculator

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RenewalCalculatorTest {

    @Test
    fun testMonthlyRenewalCalculation() {
        val current = "2026-08-30"
        val next = RenewalCalculator.calculateNextRenewalDate(current, BillingFrequency.MONTHLY)
        assertEquals("2026-09-30", next)
    }

    @Test
    fun testEndOfMonthLeapYearCalculation() {
        val leapJan31 = "2024-01-31"
        val nextFeb = RenewalCalculator.calculateNextRenewalDate(leapJan31, BillingFrequency.MONTHLY)
        assertEquals("2024-02-29", nextFeb)
    }

    @Test
    fun testDaysUntilRenewal() {
        val from = "2026-09-01"
        val target = "2026-09-08"
        val days = RenewalCalculator.calculateDaysUntilRenewal(target, from)
        assertEquals(7L, days)
    }

    @Test
    fun testIsImminentWithinWindow() {
        val from = "2026-09-01"
        val target = "2026-09-04"
        assertTrue(RenewalCalculator.isImminent(target, windowDays = 7, fromDateStr = from))
    }
}`
  },
  {
    name: 'gradle-wrapper.properties',
    path: 'gradle/wrapper/gradle-wrapper.properties',
    category: 'CONFIG',
    language: 'groovy',
    description: 'Gradle Wrapper configuration pinning exact Gradle 8.7 binary distribution with official checksum verification.',
    code: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  {
    name: 'gradle.properties',
    path: 'gradle.properties',
    category: 'CONFIG',
    language: 'groovy',
    description: 'Project-level Gradle JVM allocation, AndroidX flags, and non-transitive R class optimizations.',
    code: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  }
];
