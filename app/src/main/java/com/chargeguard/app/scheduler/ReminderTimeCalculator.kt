package com.chargeguard.app.scheduler

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

enum class AlertOffset(val daysBefore: Long, val hourOfDay: Int, val label: String) {
    SEVEN_DAYS(7, 9, "7 Days Before"),
    THREE_DAYS(3, 9, "3 Days Before"),
    TWENTY_FOUR_HOURS(1, 9, "24 Hours Before"),
    SAME_DAY_MORNING(0, 8, "Same Day (8:00 AM)"),
    IMMEDIATE_UPCOMING(0, -1, "Upcoming Warning")
}

object ReminderTimeCalculator {
    private val DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE

    /**
     * Computes the epoch millisecond timestamp for an alarm trigger given a renewal date.
     */
    fun calculateTriggerEpochMillis(
        renewalDateIso: String,
        offset: AlertOffset,
        zoneId: ZoneId = ZoneId.systemDefault()
    ): Long {
        val date = LocalDate.parse(renewalDateIso, DATE_FORMATTER)
        val targetDate = date.minusDays(offset.daysBefore)
        
        val triggerDateTime = if (offset.hourOfDay >= 0) {
            LocalDateTime.of(targetDate, LocalTime.of(offset.hourOfDay, 0))
        } else {
            // For immediate/urgent offsets when renewal is within hours
            LocalDateTime.now(zoneId).plusMinutes(2)
        }
        return triggerDateTime.atZone(zoneId).toInstant().toEpochMilli()
    }

    /**
     * Verifies if a trigger time is in the future compared to current epoch millis.
     */
    fun isSchedulable(triggerEpochMillis: Long, nowEpochMillis: Long = System.currentTimeMillis()): Boolean {
        return triggerEpochMillis > nowEpochMillis
    }
}

