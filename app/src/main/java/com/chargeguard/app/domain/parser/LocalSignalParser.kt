package com.chargeguard.app.domain.parser

import com.chargeguard.app.domain.normalization.MerchantNormalizer
import java.time.LocalDate
import java.time.format.DateTimeFormatter
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
        "grab rides", "shopee order", "lazada parcel", "p2p transfer"
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
        val eurMatcher = Pattern.compile("(?:€|EUR)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)").matcher(rawText)
        val gbpMatcher = Pattern.compile("(?:£|GBP)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)").matcher(rawText)
        val jpyMatcher = Pattern.compile("(?:¥|JPY)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)").matcher(rawText)

        if (phpMatcher.find()) {
            currency = "PHP"
            amount = phpMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        } else if (usdMatcher.find()) {
            currency = "USD"
            amount = usdMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        } else if (eurMatcher.find()) {
            currency = "EUR"
            amount = eurMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        } else if (gbpMatcher.find()) {
            currency = "GBP"
            amount = gbpMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        } else if (jpyMatcher.find()) {
            currency = "JPY"
            amount = jpyMatcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
        }

        // 3. Extract Merchant Name
        var merchant = "Subscription"
        if (lower.contains("netflix")) { merchant = "Netflix" }
        else if (lower.contains("spotify")) { merchant = "Spotify" }
        else if (lower.contains("google one") || lower.contains("google storage")) { merchant = "Google One" }
        else if (lower.contains("canva")) { merchant = "Canva" }
        else if (lower.contains("chatgpt") || lower.contains("openai")) { merchant = "ChatGPT Plus" }
        else if (lower.contains("claude") || lower.contains("anthropic")) { merchant = "Claude Pro" }
        else if (lower.contains("disney")) { merchant = "Disney+" }
        else if (lower.contains("adobe") || lower.contains("creative cloud")) { merchant = "Adobe Creative Cloud" }
        else if (lower.contains("youtube premium")) { merchant = "YouTube Premium" }
        else if (lower.contains("icloud") || lower.contains("apple music") || lower.contains("apple.com/bill")) { merchant = "Apple Services" }
        else if (lower.contains("amazon prime") || lower.contains("prime video")) { merchant = "Amazon Prime" }
        else if (lower.contains("github")) { merchant = "GitHub Pro" }
        else {
            // Regex extraction from payment patterns: "payment to X", "charged by X", "billed by X"
            val merchantPattern = Pattern.compile("(?i)(?:to|by|for|at)\\s+([A-Za-z0-9\\s&]+?)(?:\\s+(?:plan|subscription|recurring|renewal|card|account|for|on|\\$|₱|€|£|¥|[0-9]))").matcher(rawText)
            if (merchantPattern.find()) {
                val candidate = merchantPattern.group(1)?.trim() ?: ""
                if (candidate.length in 3..30) {
                    merchant = MerchantNormalizer.normalize(candidate)
                }
            }
        }

        val normalized = MerchantNormalizer.normalize(merchant)

        // 4. Extract or compute renewal date
        var renewalDateIso = ""
        val isoDateMatcher = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})").matcher(rawText)
        if (isoDateMatcher.find()) {
            renewalDateIso = isoDateMatcher.group(1) ?: ""
        } else {
            // Default renewal to 30 days from today
            try {
                renewalDateIso = LocalDate.now().plusMonths(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
            } catch (e: Exception) {
                renewalDateIso = "2026-09-30"
            }
        }

        // 5. Calculate Confidence Score
        var score = 30 // Base detection
        val reasons = mutableListOf<String>()

        if (normalized != "Subscription" && normalized != "Unknown") {
            score += 30
            reasons.add("Identified canonical merchant: $normalized (+30%)")
        }
        if (amount > 0) {
            score += 25
            reasons.add("Extracted recurring charge: $currency $amount (+25%)")
        }
        if (lower.contains("renew") || lower.contains("subscription") || lower.contains("membership") || lower.contains("trial") || lower.contains("monthly") || lower.contains("plan")) {
            score += 15
            reasons.add("Verified subscription terminology (+15%)")
        }

        val eventType = if (lower.contains("trial")) "TRIAL_END" else "RENEWAL"

        return ParsedSignal(
            merchantName = merchant,
            normalizedName = normalized,
            amount = amount,
            currency = currency,
            renewalDateIso = renewalDateIso,
            eventType = eventType,
            isIgnored = false,
            confidenceScore = score.coerceIn(0, 100),
            reasons = reasons
        )
    }
}

