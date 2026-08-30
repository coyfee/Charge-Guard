import { RenewalEvent, ParsedSignal } from '../types';

export function createEventFingerprint(
  merchant: string,
  amount: number,
  currency: string,
  date: string,
  eventType: string
): string {
  const normMerchant = merchant.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanAmount = Math.round(amount * 100);
  const cleanCurrency = currency.toUpperCase().trim();
  const cleanDate = date.trim();
  
  return `${normMerchant}_${cleanAmount}_${cleanCurrency}_${cleanDate}_${eventType}`;
}

export function isDuplicateSignal(
  signal: ParsedSignal,
  existingEvents: RenewalEvent[]
): { isDuplicate: boolean; matchedEvent?: RenewalEvent } {
  const newDate = new Date(signal.renewalDate).getTime();

  for (const event of existingEvents) {
    const isSameMerchant = 
      event.merchantName.toLowerCase() === signal.normalizedName.toLowerCase() ||
      event.merchantName.toLowerCase() === signal.merchantName.toLowerCase();
      
    const isSameAmount = Math.abs(event.amount - signal.amount) < 0.01;
    const isSameCurrency = event.currency.toUpperCase() === signal.currency.toUpperCase();

    // Check if dates are within 3 days window
    const eventDate = new Date(event.eventDate).getTime();
    const diffDays = Math.abs(newDate - eventDate) / (1000 * 60 * 60 * 24);

    if (isSameMerchant && isSameAmount && isSameCurrency && diffDays <= 3) {
      return { isDuplicate: true, matchedEvent: event };
    }
  }

  return { isDuplicate: false };
}
