package com.chargeguard.app.domain.engine

import com.chargeguard.app.domain.calculator.BillingFrequency
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class PredictionEngineTest {

    @Test
    fun testMonthlyRecurrencePrediction() {
        val events = listOf(
            ChargeEvent("2026-06-01", 549.00, "Netflix"),
            ChargeEvent("2026-07-01", 549.00, "Netflix"),
            ChargeEvent("2026-08-01", 549.00, "Netflix")
        )

        val prediction = PredictionEngine.predictFromHistory(events)
        assertNotNull(prediction)
        assertEquals(BillingFrequency.MONTHLY, prediction!!.estimatedFrequency)
        assertEquals(549.00, prediction.estimatedAmount, 0.01)
        assertEquals("2026-09-01", prediction.nextPredictedDate)
        assertEquals(90, prediction.confidence)
    }

    @Test
    fun testInsufficientEventsReturnsNull() {
        val events = listOf(
            ChargeEvent("2026-08-01", 149.00, "Spotify")
        )
        val prediction = PredictionEngine.predictFromHistory(events)
        assertNull(prediction)
    }

    @Test
    fun testWeeklyRecurrencePrediction() {
        val events = listOf(
            ChargeEvent("2026-08-01", 99.00, "Weekly Service"),
            ChargeEvent("2026-08-08", 99.00, "Weekly Service")
        )
        val prediction = PredictionEngine.predictFromHistory(events)
        assertNotNull(prediction)
        assertEquals(BillingFrequency.WEEKLY, prediction!!.estimatedFrequency)
        assertEquals("2026-08-15", prediction.nextPredictedDate)
    }
}
