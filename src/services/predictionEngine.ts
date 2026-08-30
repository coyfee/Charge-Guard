import { RenewalEvent, Subscription } from '../types';

export interface PredictionResult {
  predictedDate: string;
  confidenceScore: number;
  medianIntervalDays: number;
  sampleCount: number;
  varianceScore: number; // Low variance = high predictability
  reasons: string[];
}

export interface PriceChangeAlert {
  subscriptionId: string;
  merchantName: string;
  previousAmount: number;
  newAmount: number;
  currency: string;
  difference: number;
  percentageChange: number;
  isIncrease: boolean;
}

export function predictNextRenewal(
  events: RenewalEvent[],
  currentSubscription?: Subscription
): PredictionResult | null {
  // Sort historical events by date ascending
  const sorted = [...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  if (sorted.length < 2) {
    if (currentSubscription?.nextRenewalDate) {
      return {
        predictedDate: currentSubscription.nextRenewalDate,
        confidenceScore: 60,
        medianIntervalDays: 30,
        sampleCount: sorted.length,
        varianceScore: 0.8,
        reasons: ['Based on single renewal or manually provided schedule']
      };
    }
    return null;
  }

  // Calculate intervals in days
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1].eventDate).getTime();
    const d2 = new Date(sorted[i].eventDate).getTime();
    const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    if (days > 0) intervals.push(days);
  }

  if (intervals.length === 0) return null;

  // Compute median interval
  intervals.sort((a, b) => a - b);
  const mid = Math.floor(intervals.length / 2);
  const medianInterval = intervals.length % 2 === 0
    ? (intervals[mid - 1] + intervals[mid]) / 2
    : intervals[mid];

  // Calculate variance
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Confidence based on number of samples and regularity
  let confidence = 50;
  const reasons: string[] = [];

  if (sorted.length >= 3) {
    confidence += 25;
    reasons.push(`✓ ${sorted.length} historical renewal cycles recorded locally`);
  } else {
    confidence += 15;
    reasons.push(`✓ ${sorted.length} renewal data points recorded locally`);
  }

  if (stdDev <= 2) {
    confidence += 20;
    reasons.push(`✓ Highly consistent renewal interval (~${Math.round(medianInterval)} days)`);
  } else if (stdDev <= 5) {
    confidence += 10;
    reasons.push(`✓ Regular billing interval (~${Math.round(medianInterval)} days)`);
  }

  // Check amount stability
  const amounts = sorted.map(e => e.amount);
  const isAmountStable = amounts.every(a => Math.abs(a - amounts[0]) < 0.01);
  if (isAmountStable) {
    confidence += 5;
    reasons.push(`✓ Consistent historical charge amount (${sorted[0].currency} ${sorted[0].amount})`);
  }

  // Predict from last recorded date
  const lastEventDate = new Date(sorted[sorted.length - 1].eventDate);
  const nextDate = new Date(lastEventDate);
  nextDate.setDate(nextDate.getDate() + Math.round(medianInterval));

  // If predicted date is in the past, advance it by median interval until future
  const now = new Date();
  while (nextDate.getTime() < now.getTime() - (1000 * 60 * 60 * 24)) {
    nextDate.setDate(nextDate.getDate() + Math.round(medianInterval));
  }

  const dateStr = nextDate.toISOString().split('T')[0];

  return {
    predictedDate: dateStr,
    confidenceScore: Math.min(95, confidence),
    medianIntervalDays: medianInterval,
    sampleCount: sorted.length,
    varianceScore: stdDev,
    reasons
  };
}

export function detectPriceChange(
  currentAmount: number,
  previousAmount?: number,
  currency = 'PHP',
  subscriptionId = '',
  merchantName = ''
): PriceChangeAlert | null {
  if (!previousAmount || previousAmount <= 0 || currentAmount === previousAmount) {
    return null;
  }

  const diff = currentAmount - previousAmount;
  const pct = (diff / previousAmount) * 100;

  return {
    subscriptionId,
    merchantName,
    previousAmount,
    newAmount: currentAmount,
    currency,
    difference: diff,
    percentageChange: parseFloat(pct.toFixed(1)),
    isIncrease: diff > 0
  };
}
