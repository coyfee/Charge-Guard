package com.chargeguard.app.domain.parser

import java.util.regex.Pattern

data class ParsedSignal(
    val merchantName: String,
    val normalizedName: String,
    val amount: Double,
    val currency: String,
    val renewalDateIso: String,
    val eventType: String,
    val isIgnored: Boolean,
    val confidenceScore: Int,
    val reasons: List<String>
)

object LocalSignalParser {

    private val IGNORE_PATTERNS = listOf(
        "one-time payment", "refund issued", "bank transfer",
        "atm withdrawal", "shipping update", "food delivery",
        "grab rides", "shopee order"
    )

    fun parse(rawText: String): ParsedSignal {
        val lower = rawText.lowercase()

        // 1. Filter out one-time transactions
        for (ignored in IGNORE_PATTERNS) {
            if (lower.contains(ignored)) {
                return ParsedSignal(
                    merchantName = "Unknown",
                    normalizedName = "Ignored",
                    amount = 0.0,
                    currency = "PHP",
                    renewalDateIso = "",
                    eventType = "ONE_TIME_IGNORE",
                    isIgnored = true,
                    confidenceScore = 0,
                    reasons = listOf("Non-recurring financial signal detected: $ignored")
                )
            }
        }

        // 2. Extract Currency & Amount
        var amount = 0.0
        var currency = "PHP"
        val phpMatcher = Pattern.compile("(?:₱|PHP|Php)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)").matcher(rawText)
        val usdMatcher = Pattern.compile("(?:\\$|USD)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)").matcher(rawText)

        if (phpMatcher.find()) {
            currency = "PHP"
            amount = phpMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        } else if (usdMatcher.find()) {
            currency = "USD"
            amount = usdMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        }

        // 3. Extract Merchant
        var merchant = "Subscription"
        var normalized = "Subscription"
        if (lower.contains("netflix")) { merchant = "Netflix"; normalized = "Netflix" }
        else if (lower.contains("spotify")) { merchant = "Spotify"; normalized = "Spotify" }
        else if (lower.contains("google one") || lower.contains("google storage")) { merchant = "Google One"; normalized = "Google One" }
        else if (lower.contains("canva")) { merchant = "Canva"; normalized = "Canva" }
        else if (lower.contains("chatgpt") || lower.contains("openai")) { merchant = "ChatGPT Plus"; normalized = "ChatGPT Plus" }
        else if (lower.contains("adobe") || lower.contains("creative cloud")) { merchant = "Adobe Creative Cloud"; normalized = "Adobe Creative Cloud" }
        else if (lower.contains("youtube premium")) { merchant = "YouTube Premium"; normalized = "YouTube Premium" }
        else if (lower.contains("icloud") || lower.contains("apple music")) { merchant = "Apple Services"; normalized = "Apple Services" }

        // 4. Calculate Confidence Score
        var score = 30 // Base detection
        val reasons = mutableListOf<String>()

        if (merchant != "Subscription") {
            score += 30
            reasons.add("Identified canonical merchant: $normalized (+30%)")
        }
        if (amount > 0) {
            score += 25
            reasons.add("Extracted recurring charge: $currency $amount (+25%)")
        }
        if (lower.contains("renew") || lower.contains("subscription") || lower.contains("membership") || lower.contains("trial")) {
            score += 15
            reasons.add("Verified subscription terminology (+15%)")
        }

        val eventType = if (lower.contains("trial")) "TRIAL_END" else "RENEWAL"

        return ParsedSignal(
            merchantName = merchant,
            normalizedName = normalized,
            amount = amount,
            currency = currency,
            renewalDateIso = "2026-09-05",
            eventType = eventType,
            isIgnored = false,
            confidenceScore = score.coerceIn(0, 100),
            reasons = reasons
        )
    }
}
