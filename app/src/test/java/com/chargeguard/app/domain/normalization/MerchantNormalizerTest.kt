package com.chargeguard.app.domain.normalization

import org.junit.Assert.assertEquals
import org.junit.Test

class MerchantNormalizerTest {

    @Test
    fun testCanonicalMappings() {
        assertEquals("Netflix", MerchantNormalizer.normalize("NETFLIX.COM PAYMENT"))
        assertEquals("Spotify", MerchantNormalizer.normalize("SPOTIFY AB RECURRING"))
        assertEquals("ChatGPT Plus", MerchantNormalizer.normalize("OPENAI *CHATGPT"))
        assertEquals("Google One", MerchantNormalizer.normalize("GOOGLE STORAGE DIRECT DEBIT"))
        assertEquals("Apple Subscriptions", MerchantNormalizer.normalize("APPLE.COM/BILL"))
    }

    @Test
    fun testNoiseStripping() {
        val raw = "FIGMA INC DIRECT DEBIT SG"
        val normalized = MerchantNormalizer.normalize(raw)
        assertEquals("Figma", normalized)
    }

    @Test
    fun testGenericMerchantFormatting() {
        val raw = "gym fitness club llc recurring"
        val normalized = MerchantNormalizer.normalize(raw)
        assertEquals("Gym Fitness Club", normalized)
    }
}
