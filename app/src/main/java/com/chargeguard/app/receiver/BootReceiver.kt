package com.chargeguard.app.receiver

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
}
