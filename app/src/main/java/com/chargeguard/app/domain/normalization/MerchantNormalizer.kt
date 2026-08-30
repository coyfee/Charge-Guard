package com.chargeguard.app.domain.normalization

object MerchantNormalizer {

    private val STRIP_PATTERNS = listOf(
        "(?i)\\b(inc|llc|ltd|corp|co|gmbh|pty|srl|sa|corp\\.|ltd\\.)\\b",
        "(?i)\\b(direct debit|recurring|sub|subscription|bill|pymt|pmt|card)\\b",
        "(?i)\\b(pos|e-comm|auth|settlement|intl|sg|us|ph|uk)\\b",
        "[^a-zA-Z0-9\\s&]"
    )

    private val CANONICAL_MAP = mapOf(
        "netflix" to "Netflix",
        "spotify" to "Spotify",
        "openai" to "ChatGPT Plus",
        "chatgpt" to "ChatGPT Plus",
        "anthropic" to "Claude Pro",
        "claude" to "Claude Pro",
        "google storage" to "Google One",
        "google one" to "Google One",
        "gsuite" to "Google Workspace",
        "youtube" to "YouTube Premium",
        "disney" to "Disney+",
        "hbo" to "Max / HBO",
        "canva" to "Canva Pro",
        "adobe" to "Adobe Creative Cloud",
        "figma" to "Figma",
        "github" to "GitHub Pro",
        "cursor" to "Cursor AI",
        "midjourney" to "Midjourney",
        "amazon prime" to "Amazon Prime",
        "apple.com/bill" to "Apple Subscriptions",
        "apple music" to "Apple Music",
        "icloud" to "Apple iCloud+",
        "notion" to "Notion",
        "dropbox" to "Dropbox",
        "playstation" to "PlayStation Plus",
        "xbox" to "Xbox Game Pass",
        "crunchyroll" to "Crunchyroll"
    )

    fun normalize(rawMerchantName: String): String {
        val trimmed = rawMerchantName.trim().lowercase()

        // 1. Direct canonical lookup
        for ((key, canonical) in CANONICAL_MAP) {
            if (trimmed.contains(key)) {
                return canonical
            }
        }

        // 2. Fallback regex cleanup
        var cleaned = rawMerchantName
        for (pattern in STRIP_PATTERNS) {
            cleaned = cleaned.replace(Regex(pattern), " ")
        }
        cleaned = cleaned.replace(Regex("\\s+"), " ").trim()

        return if (cleaned.isNotEmpty()) {
            cleaned.split(" ").joinToString(" ") { word ->
                word.lowercase().replaceFirstChar { it.uppercase() }
            }
        } else {
            rawMerchantName.trim()
        }
    }
}
