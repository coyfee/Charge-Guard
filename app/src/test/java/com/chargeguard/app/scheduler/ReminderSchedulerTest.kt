package com.chargeguard.app.scheduler

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class ReminderSchedulerTest {

    private val zoneUtc = ZoneId.of("UTC")

    @Test
    fun testSevenDaysBeforeCalculation() {
        val renewalDate = "2026-09-10"
        val triggerEpoch = ReminderTimeCalculator.calculateTriggerEpochMillis(
            renewalDateIso = renewalDate,
            offset = AlertOffset.SEVEN_DAYS,
            zoneId = zoneUtc
        )

        // 2026-09-03 09:00:00 UTC
        val expectedEpoch = java.time.LocalDateTime.of(2026, 9, 3, 9, 0)
            .atZone(zoneUtc)
            .toInstant()
            .toEpochMilli()

        assertEquals(expectedEpoch, triggerEpoch)
    }

    @Test
    fun testTwentyFourHoursBeforeCalculation() {
        val renewalDate = "2026-09-10"
        val triggerEpoch = ReminderTimeCalculator.calculateTriggerEpochMillis(
            renewalDateIso = renewalDate,
            offset = AlertOffset.TWENTY_FOUR_HOURS,
            zoneId = zoneUtc
        )

        // 2026-09-09 09:00:00 UTC
        val expectedEpoch = java.time.LocalDateTime.of(2026, 9, 9, 9, 0)
            .atZone(zoneUtc)
            .toInstant()
            .toEpochMilli()

        assertEquals(expectedEpoch, triggerEpoch)
    }

    @Test
    fun testIsSchedulableInFuture() {
        val futureEpoch = System.currentTimeMillis() + 86400000L
        val pastEpoch = System.currentTimeMillis() - 86400000L

        assertTrue(ReminderTimeCalculator.isSchedulable(futureEpoch))
        assertTrue(!ReminderTimeCalculator.isSchedulable(pastEpoch))
    }
}
