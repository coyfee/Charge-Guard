package com.chargeguard.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.chargeguard.app.data.local.dao.ReminderDao
import com.chargeguard.app.data.local.dao.SubscriptionDao
import com.chargeguard.app.data.local.entity.ReminderEntity
import com.chargeguard.app.data.local.entity.SubscriptionEntity

@Database(
    entities = [
        SubscriptionEntity::class,
        ReminderEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class ChargeGuardDatabase : RoomDatabase() {

    abstract fun subscriptionDao(): SubscriptionDao
    abstract fun reminderDao(): ReminderDao

    companion object {
        @Volatile
        private var INSTANCE: ChargeGuardDatabase? = null

        fun getInstance(context: Context): ChargeGuardDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ChargeGuardDatabase::class.java,
                    "chargeguard_local.db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
