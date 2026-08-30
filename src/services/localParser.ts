import { BillingFrequency, DetectionSource, ParsedSignal } from '../types';
import { normalizeMerchant } from './merchantNormalization';

const IGNORED_KEYWORDS = [
  'one-time payment',
  'one time payment',
  'single purchase',
  'refund issued',
  'refunded',
  'fund transfer',
  'bank transfer',
  'atm withdrawal',
  'cash withdrawal',
  'shipping update',
  'order delivered',
  'package arrived',
  'flight booking',
  'hotel reservation',
  'food delivery',
  'ride receipt'
];

const RENEWAL_KEYWORDS = [
  'renews automatically',
  'renews',
  'renewal',
  'will renew',
  'next payment',
  'upcoming payment',
  'will be charged',
  'recurring payment',
  'subscription payment',
  'membership renewal',
  'trial ends',
  'free trial',
  'annual renewal',
  'monthly renewal',
  'billing cycle',
  'auto-renewal',
  'membership fee'
];

const TRIAL_KEYWORDS = [
  'trial ends',
  'free trial',
  'trial period',
  'trial expiring',
  'trial will end'
];

const PRICE_CHANGE_KEYWORDS = [
  'price change',
  'price increase',
  'new subscription rate',
  'rate update',
  'plan price update',
  'will now cost',
  'updated pricing'
];

export function parseSubscriptionSignal(
  rawText: string,
  source: DetectionSource = 'NOTIFICATION'
): ParsedSignal {
  const lowerText = rawText.toLowerCase();

  // Check if this is an ignored non-subscription transaction
  for (const ignored of IGNORED_KEYWORDS) {
    if (lowerText.includes(ignored)) {
      return {
        merchantName: 'Unknown',
        normalizedName: 'Ignored Transaction',
        amount: 0,
        currency: 'PHP',
        renewalDate: new Date().toISOString().split('T')[0],
        billingFrequency: 'MONTHLY',
        eventType: 'ONE_TIME_IGNORE',
        rawText,
        source,
        isIgnoredTransaction: true,
        ignoreReason: `Identified non-recurring transaction pattern: "${ignored}"`
      };
    }
  }

  // 1. Detect Event Type
  let eventType: ParsedSignal['eventType'] = 'RENEWAL';
  if (TRIAL_KEYWORDS.some(k => lowerText.includes(k))) {
    eventType = 'TRIAL_END';
  } else if (PRICE_CHANGE_KEYWORDS.some(k => lowerText.includes(k))) {
    eventType = 'PRICE_CHANGE';
  } else if (lowerText.includes('upcoming') || lowerText.includes('will be charged')) {
    eventType = 'UPCOMING_CHARGE';
  }

  // 2. Extract Currency & Amount
  let amount = 0;
  let currency = 'PHP';

  // Currency regex matchers
  const phpRegex = /(?:₱|PHP|Php|php)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/;
  const usdRegex = /(?:\$|USD)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/;
  const eurRegex = /(?:€|EUR)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/;
  const gbpRegex = /(?:£|GBP)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/;
  const jpyRegex = /(?:¥|JPY)\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)/;

  const phpMatch = rawText.match(phpRegex);
  const usdMatch = rawText.match(usdRegex);
  const eurMatch = rawText.match(eurRegex);
  const gbpMatch = rawText.match(gbpRegex);
  const jpyMatch = rawText.match(jpyRegex);

  if (phpMatch) {
    currency = 'PHP';
    amount = parseFloat(phpMatch[1].replace(/,/g, ''));
  } else if (usdMatch) {
    currency = 'USD';
    amount = parseFloat(usdMatch[1].replace(/,/g, ''));
  } else if (eurMatch) {
    currency = 'EUR';
    amount = parseFloat(eurMatch[1].replace(/,/g, ''));
  } else if (gbpMatch) {
    currency = 'GBP';
    amount = parseFloat(gbpMatch[1].replace(/,/g, ''));
  } else if (jpyMatch) {
    currency = 'JPY';
    amount = parseFloat(jpyMatch[1].replace(/,/g, ''));
  } else {
    // Fallback amount match
    const genericMatch = rawText.match(/(?:amount|cost|charged|charge|total|price)\s*(?:is|of|:)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (genericMatch) {
      amount = parseFloat(genericMatch[1]);
    }
  }

  // 3. Extract Merchant
  let rawMerchant = 'Subscription';
  const knownMerchants = [
    'netflix', 'spotify', 'google one', 'google', 'youtube premium', 'youtube',
    'canva', 'chatgpt', 'openai', 'apple', 'icloud', 'github', 'amazon prime',
    'prime video', 'disney+', 'disney', 'adobe', 'microsoft 365', 'midjourney',
    'notion', 'duolingo'
  ];

  for (const m of knownMerchants) {
    if (lowerText.includes(m)) {
      rawMerchant = m;
      break;
    }
  }

  // If not in known list, try extracting from "Your [Merchant] subscription" or "[Merchant] will renew"
  if (rawMerchant === 'Subscription') {
    const merchantMatch = rawText.match(/(?:your\s+([A-Za-z0-9\s]+?)\s+(?:subscription|membership|plan|account))|(([A-Za-z0-9\s]+?)\s+(?:will renew|renews|subscription payment))/i);
    if (merchantMatch) {
      rawMerchant = (merchantMatch[1] || merchantMatch[2] || '').trim();
    }
  }

  const normalized = normalizeMerchant(rawMerchant);
  if (amount === 0 && normalized.defaultAmount) {
    amount = normalized.defaultAmount;
    currency = normalized.defaultCurrency || 'PHP';
  }

  // 4. Extract Renewal Date
  const renewalDate = extractDate(rawText);

  // 5. Extract Billing Frequency
  let billingFrequency: BillingFrequency = 'MONTHLY';
  if (lowerText.includes('year') || lowerText.includes('annual') || lowerText.includes('/yr')) {
    billingFrequency = 'YEARLY';
  } else if (lowerText.includes('week') || lowerText.includes('/wk')) {
    billingFrequency = 'WEEKLY';
  } else if (lowerText.includes('quarter') || lowerText.includes('3 months')) {
    billingFrequency = 'QUARTERLY';
  }

  // 6. Extract Payment Method info (last 4 digits / provider)
  let paymentMethod: string | undefined;
  const cardMatch = rawText.match(/(?:ending in|card|visa|mastercard|gcash|maya)\s*([0-9]{4}|[A-Za-z0-9]+)/i);
  if (cardMatch) {
    paymentMethod = cardMatch[0].trim();
  }

  return {
    merchantName: rawMerchant,
    normalizedName: normalized.canonicalName,
    amount,
    currency,
    renewalDate,
    billingFrequency,
    eventType,
    paymentMethod,
    rawText,
    source,
    isIgnoredTransaction: false
  };
}

function extractDate(text: string): string {
  const now = new Date();
  const lower = text.toLowerCase();

  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  if (lower.includes('today')) {
    return now.toISOString().split('T')[0];
  }

  if (lower.includes('in 3 days')) {
    const in3 = new Date(now);
    in3.setDate(now.getDate() + 3);
    return in3.toISOString().split('T')[0];
  }

  if (lower.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  // Match month names: Sep 3, September 3, 3 September, Sep 3 2026, 03/09/2026
  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const monthRegex = /(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i;
  const monthMatch = text.match(monthRegex);
  if (monthMatch) {
    const mStr = monthMatch[1].toLowerCase();
    const monthIndex = months[mStr] ?? now.getMonth();
    const day = parseInt(monthMatch[2], 10);
    const year = monthMatch[3] ? parseInt(monthMatch[3], 10) : now.getFullYear();

    const d = new Date(year, monthIndex, day);
    // If date is in past this year and no explicit year given, push to next year
    if (!monthMatch[3] && d.getTime() < now.getTime() - 86400000) {
      d.setFullYear(now.getFullYear() + 1);
    }
    return d.toISOString().split('T')[0];
  }

  // Match format: 03/09/2026 or 2026-09-03
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Fallback: 30 days from now
  const fallback = new Date(now);
  fallback.setDate(now.getDate() + 30);
  return fallback.toISOString().split('T')[0];
}
