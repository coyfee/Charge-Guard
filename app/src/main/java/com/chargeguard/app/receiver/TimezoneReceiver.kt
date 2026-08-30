package com.chargeguard.app.receiver

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
}
