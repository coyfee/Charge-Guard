package com.chargeguard.app.domain.engine

import com.chargeguard.app.domain.calculator.BillingFrequency
import com.chargeguard.app.domain.calculator.RenewalCalculator
import java.time.LocalDate
import java.time.temporal.ChronoUnit

data class ChargeEvent(
    val dateIso: String,
    val amount: Double,
    val merchant: String
)

data class PredictedSubscription(
    val merchant: String,
    val estimatedAmount: Double,
    val estimatedFrequency: BillingFrequency,
    val nextPredictedDate: String,
    val confidence: Int
)

object PredictionEngine {

    /**
     * Detects recurrence patterns across a sequence of charge events without cloud connection.
     */
    fun predictFromHistory(events: List<ChargeEvent>): PredictedSubscription? {
        if (events.size < 2) return null

        val sorted = events.sortedBy { it.dateIso }
        val dates = sorted.map { LocalDate.parse(it.dateIso) }

        // Compute average interval in days
        var totalDays = 0L
        for (i in 1 until dates.size) {
            totalDays += ChronoUnit.DAYS.between(dates[i - 1], dates[i])
        }
        val avgInterval = totalDays.toDouble() / (dates.size - 1)

        val frequency = when {
            avgInterval in 6.0..8.0 -> BillingFrequency.WEEKLY
            avgInterval in 26.0..35.0 -> BillingFrequency.MONTHLY
            avgInterval in 85.0..95.0 -> BillingFrequency.QUARTERLY
            avgInterval in 350.0..370.0 -> BillingFrequency.YEARLY
            else -> return null
        }

        val lastDateStr = sorted.last().dateIso
        val nextDate = RenewalCalculator.calculateNextRenewalDate(lastDateStr, frequency)
        val avgAmount = sorted.map { it.amount }.average()

        val confidence = when {
            events.size >= 3 -> 90
            else -> 75
        }

        return PredictedSubscription(
            merchant = sorted.first().merchant,
            estimatedAmount = avgAmount,
            estimatedFrequency = frequency,
            nextPredictedDate = nextDate,
            confidence = confidence
        )
    }
}
