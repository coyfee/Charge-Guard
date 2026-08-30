package com.chargeguard.app.domain.parser

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalSignalParserTest {

    @Test
    fun testParseNetflixRenewalSms() {
        val raw = "Your Netflix standard plan renewal for PHP 549.00 will be charged on Sept 5, 2026."
        val signal = LocalSignalParser.parse(raw)

        assertFalse(signal.isIgnored)
        assertEquals("Netflix", signal.merchantName)
        assertEquals(549.00, signal.amount, 0.01)
        assertEquals("PHP", signal.currency)
        assertTrue(signal.confidenceScore >= 80)
    }

    @Test
    fun testParseChatGptUsdSignal() {
        val raw = "OpenAI ChatGPT Plus subscription renewed. Charged $20.00 to card."
        val signal = LocalSignalParser.parse(raw)

        assertFalse(signal.isIgnored)
        assertEquals("ChatGPT Plus", signal.merchantName)
        assertEquals(20.00, signal.amount, 0.01)
        assertEquals("USD", signal.currency)
    }

    @Test
    fun testIgnoreOneTimeTransactions() {
        val raw = "Grab rides food delivery payment of PHP 350.00 confirmed. One-time payment."
        val signal = LocalSignalParser.parse(raw)

        assertTrue(signal.isIgnored)
        assertEquals(0, signal.confidenceScore)
    }

    @Test
    fun testTrialEndDetection() {
        val raw = "Canva Pro free trial ends soon. Your subscription will auto-renew for PHP 249.00."
        val signal = LocalSignalParser.parse(raw)

        assertFalse(signal.isIgnored)
        assertEquals("TRIAL_END", signal.eventType)
        assertEquals("Canva", signal.merchantName)
    }
}
