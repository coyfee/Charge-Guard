package com.chargeguard.app.domain.calculator

import java.time.LocalDate
import java.time.format.DateTimeFormatter

enum class BillingFrequency {
    WEEKLY,
    MONTHLY,
    QUARTERLY,
    SEMI_ANNUALLY,
    YEARLY
}

object RenewalCalculator {
    private val FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE

    /**
     * Computes the next renewal date strictly using calendar arithmetic,
     * correctly handling month length variations (e.g. Feb 28/29, 30-day months) and leap years.
     */
    fun calculateNextRenewalDate(currentDateStr: String, frequency: BillingFrequency): String {
        val date = LocalDate.parse(currentDateStr, FORMATTER)
        val nextDate = when (frequency) {
            BillingFrequency.WEEKLY -> date.plusWeeks(1)
            BillingFrequency.MONTHLY -> date.plusMonths(1)
            BillingFrequency.QUARTERLY -> date.plusMonths(3)
            BillingFrequency.SEMI_ANNUALLY -> date.plusMonths(6)
            BillingFrequency.YEARLY -> date.plusYears(1)
        }
        return nextDate.format(FORMATTER)
    }

    /**
     * Calculates days remaining until the target renewal date.
     */
    fun calculateDaysUntilRenewal(targetDateStr: String, fromDateStr: String = LocalDate.now().format(FORMATTER)): Long {
        val target = LocalDate.parse(targetDateStr, FORMATTER)
        val from = LocalDate.parse(fromDateStr, FORMATTER)
        return java.time.temporal.ChronoUnit.DAYS.between(from, target)
    }

    /**
     * Checks if a renewal falls within an active warning window (e.g. 7 days or less).
     */
    fun isImminent(targetDateStr: String, windowDays: Int = 7, fromDateStr: String = LocalDate.now().format(FORMATTER)): Boolean {
        val days = calculateDaysUntilRenewal(targetDateStr, fromDateStr)
        return days in 0..windowDays
    }
}
