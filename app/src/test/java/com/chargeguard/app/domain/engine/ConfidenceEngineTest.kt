package com.chargeguard.app.domain.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ConfidenceEngineTest {

    @Test
    fun testHighConfidenceExplicitSignal() {
        val result = ConfidenceEngine.calculate(
            hasExplicitDate = true,     // +35
            isKnownMerchant = true,     // +25
            hasExactAmount = true,      // +20
            hasRenewalKeyword = true,   // +10
            isTrial = false,
            historyCount = 2            // +10
        )
        assertEquals(100, result.score)
        assertEquals(ConfidenceLevel.HIGH, result.level)
        assertTrue(result.factors.size >= 4)
    }

    @Test
    fun testMediumConfidencePartialSignal() {
        val result = ConfidenceEngine.calculate(
            hasExplicitDate = true,     // +35
            isKnownMerchant = true,     // +25
            hasExactAmount = false,
            hasRenewalKeyword = false,
            isTrial = false,
            historyCount = 0
        )
        assertEquals(60, result.score)
        assertEquals(ConfidenceLevel.MEDIUM, result.level)
    }

    @Test
    fun testLowConfidenceVagueSignal() {
        val result = ConfidenceEngine.calculate(
            hasExplicitDate = false,
            isKnownMerchant = false,
            hasExactAmount = false,
            hasRenewalKeyword = true,   // +10
            isTrial = false,
            historyCount = 0
        )
        assertEquals(10, result.score)
        assertEquals(ConfidenceLevel.LOW, result.level)
    }
}
