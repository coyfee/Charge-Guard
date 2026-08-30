package com.chargeguard.app.domain.calculator

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
    fun testYearlyRenewalCalculation() {
        val current = "2026-08-30"
        val next = RenewalCalculator.calculateNextRenewalDate(current, BillingFrequency.YEARLY)
        assertEquals("2027-08-30", next)
    }

    @Test
    fun testQuarterlyRenewalCalculation() {
        val current = "2026-01-15"
        val next = RenewalCalculator.calculateNextRenewalDate(current, BillingFrequency.QUARTERLY)
        assertEquals("2026-04-15", next)
    }

    @Test
    fun testEndOfMonthLeapYearCalculation() {
        val leapJan31 = "2024-01-31"
        val nextFeb = RenewalCalculator.calculateNextRenewalDate(leapJan31, BillingFrequency.MONTHLY)
        assertEquals("2024-02-29", nextFeb)
    }

    @Test
    fun testEndOfMonthNonLeapYearCalculation() {
        val nonLeapJan31 = "2025-01-31"
        val nextFeb = RenewalCalculator.calculateNextRenewalDate(nonLeapJan31, BillingFrequency.MONTHLY)
        assertEquals("2025-02-28", nextFeb)
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

        val distantTarget = "2026-09-20"
        assertFalse(RenewalCalculator.isImminent(distantTarget, windowDays = 7, fromDateStr = from))
    }
}
