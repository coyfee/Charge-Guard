package com.chargeguard.app.domain.engine

data class ConfidenceResult(
    val score: Int, // 0 - 100
    val level: ConfidenceLevel,
    val factors: List<String>
)

enum class ConfidenceLevel {
    HIGH,   // 80 - 100
    MEDIUM, // 50 - 79
    LOW     // 0 - 49
}

object ConfidenceEngine {

    fun calculate(
        hasExplicitDate: Boolean,
        isKnownMerchant: Boolean,
        hasExactAmount: Boolean,
        hasRenewalKeyword: Boolean,
        isTrial: Boolean,
        historyCount: Int = 0
    ): ConfidenceResult {
        var score = 0
        val factors = mutableListOf<String>()

        if (hasExplicitDate) {
            score += 35
            factors.add("Explicit ISO date detected (+35%)")
        }
        if (isKnownMerchant) {
            score += 25
            factors.add("Matched canonical subscription merchant (+25%)")
        }
        if (hasExactAmount) {
            score += 20
            factors.add("Exact monetary amount parsed (+20%)")
        }
        if (hasRenewalKeyword) {
            score += 10
            factors.add("Recurring/renewal terminology present (+10%)")
        }
        if (isTrial) {
            score += 10
            factors.add("Free trial conversion warning attached (+10%)")
        }
        if (historyCount >= 2) {
            score += 10
            factors.add("Historical recurrence verified across multiple periods (+10%)")
        }

        val finalScore = score.coerceIn(0, 100)
        val level = when {
            finalScore >= 80 -> ConfidenceLevel.HIGH
            finalScore >= 50 -> ConfidenceLevel.MEDIUM
            else -> ConfidenceLevel.LOW
        }

        return ConfidenceResult(finalScore, level, factors)
    }
}
