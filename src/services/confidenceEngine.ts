import { ConfidenceScore, ParsedSignal, Subscription } from '../types';

export function calculateConfidence(
  signal: ParsedSignal,
  existingSubscriptions: Subscription[] = []
): ConfidenceScore {
  if (signal.isIgnoredTransaction) {
    return {
      score: 0,
      classification: 'IGNORE',
      reasons: [signal.ignoreReason || 'Non-recurring transaction filtered']
    };
  }

  let score = 0;
  const reasons: string[] = [];

  // 1. Explicit renewal date (+40)
  if (signal.renewalDate) {
    score += 40;
    reasons.push('✓ Explicit renewal date found in signal (+40%)');
  }

  // 2. Merchant detected (+20)
  if (signal.merchantName && signal.merchantName !== 'Subscription') {
    score += 20;
    reasons.push(`✓ Identified merchant: "${signal.normalizedName}" (+20%)`);
  }

  // 3. Amount detected (+15)
  if (signal.amount > 0) {
    score += 15;
    reasons.push(`✓ Recurring amount extracted: ${signal.currency} ${signal.amount} (+15%)`);
  }

  // 4. Renewal language (+10)
  const lower = signal.rawText.toLowerCase();
  const hasRenewalLang = 
    lower.includes('renew') || 
    lower.includes('recurring') || 
    lower.includes('trial') || 
    lower.includes('upcoming') ||
    lower.includes('membership');

  if (hasRenewalLang) {
    score += 10;
    reasons.push('✓ Recurring subscription / renewal terminology verified (+10%)');
  }

  // 5. Previous matching subscription (+10)
  const match = existingSubscriptions.find(
    s => s.merchantName.toLowerCase() === signal.normalizedName.toLowerCase() ||
         s.displayName.toLowerCase() === signal.normalizedName.toLowerCase()
  );
  if (match) {
    score += 10;
    reasons.push(`✓ Matches existing tracked subscription history (${match.displayName}) (+10%)`);
  }

  // 6. Payment method detected (+5)
  if (signal.paymentMethod) {
    score += 5;
    reasons.push(`✓ Payment method pattern identified (${signal.paymentMethod}) (+5%)`);
  }

  // Cap score at 100
  score = Math.min(100, score);

  let classification: ConfidenceScore['classification'] = 'IGNORE';
  if (score >= 90) {
    classification = 'CONFIRMED';
  } else if (score >= 75) {
    classification = 'HIGH_CONFIDENCE';
  } else if (score >= 50) {
    classification = 'PREDICTED';
  } else {
    classification = 'IGNORE';
  }

  return {
    score,
    classification,
    reasons
  };
}
