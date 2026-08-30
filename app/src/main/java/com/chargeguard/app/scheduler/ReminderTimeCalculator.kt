package com.chargeguard.app.scheduler

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

enum class AlertOffset(val daysBefore: Long, val hourOfDay: Int) {
    SEVEN_DAYS(7, 9),        // 7 days before at 9:00 AM
    THREE_DAYS(3, 9),        // 3 days before at 9:00 AM
    TWENTY_FOUR_HOURS(1, 9), // 1 day before at 9:00 AM
    SAME_DAY_MORNING(0, 8)   // Day of charge at 8:00 AM
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
        val triggerDateTime = LocalDateTime.of(targetDate, LocalTime.of(offset.hourOfDay, 0))
        return triggerDateTime.atZone(zoneId).toInstant().toEpochMilli()
    }

    /**
     * Verifies if a trigger time is in the future compared to current epoch millis.
     */
    fun isSchedulable(triggerEpochMillis: Long, nowEpochMillis: Long = System.currentTimeMillis()): Boolean {
        return triggerEpochMillis > nowEpochMillis
    }
}
