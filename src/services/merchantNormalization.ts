import { Category } from '../types';

export interface NormalizedMerchant {
  canonicalName: string;
  category: Category;
  color: string;
  bgColor: string;
  defaultAmount?: number;
  defaultCurrency?: string;
  defaultFrequency?: 'MONTHLY' | 'YEARLY';
}

const MERCHANT_DATABASE: Record<string, NormalizedMerchant> = {
  'netflix': {
    canonicalName: 'Netflix',
    category: 'STREAMING',
    color: '#E50914',
    bgColor: 'rgba(229, 9, 20, 0.12)',
    defaultAmount: 549,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'spotify': {
    canonicalName: 'Spotify',
    category: 'STREAMING',
    color: '#1DB954',
    bgColor: 'rgba(29, 185, 84, 0.12)',
    defaultAmount: 149,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'google one': {
    canonicalName: 'Google One',
    category: 'CLOUD_STORAGE',
    color: '#4285F4',
    bgColor: 'rgba(66, 133, 244, 0.12)',
    defaultAmount: 99,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'google': {
    canonicalName: 'Google One',
    category: 'CLOUD_STORAGE',
    color: '#4285F4',
    bgColor: 'rgba(66, 133, 244, 0.12)'
  },
  'youtube premium': {
    canonicalName: 'YouTube Premium',
    category: 'STREAMING',
    color: '#FF0000',
    bgColor: 'rgba(255, 0, 0, 0.12)',
    defaultAmount: 239,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'youtube': {
    canonicalName: 'YouTube Premium',
    category: 'STREAMING',
    color: '#FF0000',
    bgColor: 'rgba(255, 0, 0, 0.12)'
  },
  'canva': {
    canonicalName: 'Canva',
    category: 'PRODUCTIVITY',
    color: '#00C4CC',
    bgColor: 'rgba(0, 196, 204, 0.12)',
    defaultAmount: 799,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'chatgpt': {
    canonicalName: 'ChatGPT Plus',
    category: 'AI_TOOLS',
    color: '#10A37F',
    bgColor: 'rgba(16, 163, 127, 0.12)',
    defaultAmount: 1150,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'openai': {
    canonicalName: 'ChatGPT Plus',
    category: 'AI_TOOLS',
    color: '#10A37F',
    bgColor: 'rgba(16, 163, 127, 0.12)'
  },
  'apple': {
    canonicalName: 'Apple iCloud+',
    category: 'CLOUD_STORAGE',
    color: '#A2AAAD',
    bgColor: 'rgba(162, 170, 173, 0.15)',
    defaultAmount: 49,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'icloud': {
    canonicalName: 'Apple iCloud+',
    category: 'CLOUD_STORAGE',
    color: '#A2AAAD',
    bgColor: 'rgba(162, 170, 173, 0.15)'
  },
  'github': {
    canonicalName: 'GitHub Copilot',
    category: 'DEVELOPER',
    color: '#6e40c9',
    bgColor: 'rgba(110, 64, 201, 0.15)',
    defaultAmount: 580,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'amazon prime': {
    canonicalName: 'Amazon Prime',
    category: 'STREAMING',
    color: '#00A8E1',
    bgColor: 'rgba(0, 168, 225, 0.12)',
    defaultAmount: 149,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'prime video': {
    canonicalName: 'Amazon Prime',
    category: 'STREAMING',
    color: '#00A8E1',
    bgColor: 'rgba(0, 168, 225, 0.12)'
  },
  'disney+': {
    canonicalName: 'Disney+',
    category: 'STREAMING',
    color: '#113CCF',
    bgColor: 'rgba(17, 60, 207, 0.15)',
    defaultAmount: 369,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'disney': {
    canonicalName: 'Disney+',
    category: 'STREAMING',
    color: '#113CCF',
    bgColor: 'rgba(17, 60, 207, 0.15)'
  },
  'adobe': {
    canonicalName: 'Adobe Creative Cloud',
    category: 'PRODUCTIVITY',
    color: '#FA0F00',
    bgColor: 'rgba(250, 15, 0, 0.12)',
    defaultAmount: 1499,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'microsoft 365': {
    canonicalName: 'Microsoft 365',
    category: 'PRODUCTIVITY',
    color: '#D83B01',
    bgColor: 'rgba(216, 59, 1, 0.12)',
    defaultAmount: 499,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'midjourney': {
    canonicalName: 'Midjourney',
    category: 'AI_TOOLS',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    defaultAmount: 580,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'notion': {
    canonicalName: 'Notion Plus',
    category: 'PRODUCTIVITY',
    color: '#FFFFFF',
    bgColor: 'rgba(255, 255, 255, 0.12)',
    defaultAmount: 580,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  },
  'duolingo': {
    canonicalName: 'Duolingo Super',
    category: 'OTHER',
    color: '#58CC02',
    bgColor: 'rgba(88, 204, 2, 0.12)',
    defaultAmount: 299,
    defaultCurrency: 'PHP',
    defaultFrequency: 'MONTHLY'
  }
};

const ALIAS_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /netflix(?:\.com| inc| subscription| ph)?/i, canonical: 'netflix' },
  { pattern: /spotify(?:\.com| ab| premium| family| individual)?/i, canonical: 'spotify' },
  { pattern: /google\s*(?:one|storage|services|play\s*subscription)?/i, canonical: 'google one' },
  { pattern: /youtube(?:\s*premium|\s*music|\s*membership)?/i, canonical: 'youtube premium' },
  { pattern: /canva(?:\s*pro|\s*pty\s*ltd|\s*subscription)?/i, canonical: 'canva' },
  { pattern: /(?:chatgpt|openai)(?:\s*plus|\s*subscription)?/i, canonical: 'chatgpt' },
  { pattern: /apple(?:\.com\/bill| icloud|\s*services|\s*one)?/i, canonical: 'apple' },
  { pattern: /github(?:\s*copilot|\s*pro)?/i, canonical: 'github' },
  { pattern: /amazon\s*(?:prime|prime\s*video|amzn\s*prime)?/i, canonical: 'amazon prime' },
  { pattern: /disney(?:\+| plus)?/i, canonical: 'disney+' },
  { pattern: /adobe(?:\s*creative\s*cloud|\s*systems|\s*cc)?/i, canonical: 'adobe' },
  { pattern: /microsoft(?:\s*365|\s*office|\s*azure)?/i, canonical: 'microsoft 365' },
  { pattern: /midjourney/i, canonical: 'midjourney' },
  { pattern: /notion(?:\s*plus|\s*ai)?/i, canonical: 'notion' },
  { pattern: /duolingo(?:\s*super|\s*plus|\s*max)?/i, canonical: 'duolingo' }
];

export function normalizeMerchant(rawInput: string): NormalizedMerchant {
  const clean = rawInput.trim().toLowerCase();
  
  // Direct match
  if (MERCHANT_DATABASE[clean]) {
    return MERCHANT_DATABASE[clean];
  }

  // Regex pattern match
  for (const { pattern, canonical } of ALIAS_PATTERNS) {
    if (pattern.test(clean)) {
      return MERCHANT_DATABASE[canonical];
    }
  }

  // Fallback: title case formatted
  const formatted = rawInput
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    canonicalName: formatted || 'Subscription',
    category: 'OTHER',
    color: '#10B981', // Emerald default
    bgColor: 'rgba(16, 185, 129, 0.12)'
  };
}
