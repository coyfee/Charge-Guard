import { Reminder, ReminderType, Subscription } from '../types';

export interface ScheduleCalculation {
  reminderType: ReminderType;
  triggerTime: string;
  title: string;
  body: string;
}

export function calculateReminderTimes(subscription: Subscription): ScheduleCalculation[] {
  const calculations: ScheduleCalculation[] = [];
  const renewalDate = new Date(subscription.nextRenewalDate + 'T09:00:00'); // Default to 9:00 AM on renewal day
  const formattedCurrency = subscription.currency === 'PHP' ? '₱' : (subscription.currency === 'USD' ? '$' : subscription.currency);
  const formattedAmount = `${formattedCurrency}${subscription.amount.toLocaleString()}`;

  const alertTypes = subscription.enabledAlerts || ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS'];

  for (const type of alertTypes) {
    let triggerDate = new Date(renewalDate);
    let title = '';
    let body = '';

    switch (type) {
      case 'SEVEN_DAYS':
        triggerDate.setDate(triggerDate.getDate() - 7);
        title = `🛡️ ${subscription.displayName} renews in 7 days`;
        body = `Upcoming charge of ${formattedAmount} on ${formatHumanDate(subscription.nextRenewalDate)}. Cancel before renewal if no longer needed.`;
        break;

      case 'THREE_DAYS':
        triggerDate.setDate(triggerDate.getDate() - 3);
        title = `⚠️ ${subscription.displayName} renews in 3 days`;
        body = `Reminder: ${formattedAmount} will be charged on ${formatHumanDate(subscription.nextRenewalDate)}.`;
        break;

      case 'TWENTY_FOUR_HOURS':
        triggerDate.setDate(triggerDate.getDate() - 1);
        title = `🚨 ${subscription.displayName} renews tomorrow!`;
        body = `Pre-charge alert: ${subscription.displayName} (${formattedAmount}) renews tomorrow.`;
        break;

      case 'ONE_HOUR':
        triggerDate = new Date(renewalDate.getTime() - 60 * 60 * 1000);
        title = `⚡ ${subscription.displayName} renews in 1 hour`;
        body = `Final early warning: ${formattedAmount} renewal will process shortly.`;
        break;

      case 'DAY_OF':
        title = `🔔 ${subscription.displayName} renews today`;
        body = `${subscription.displayName} is scheduled to charge ${formattedAmount} today.`;
        break;

      case 'CUSTOM':
        triggerDate.setDate(triggerDate.getDate() - 2);
        title = `🔔 ${subscription.displayName} renewal warning`;
        body = `Upcoming renewal for ${formattedAmount}.`;
        break;
    }

    calculations.push({
      reminderType: type,
      triggerTime: triggerDate.toISOString(),
      title,
      body
    });
  }

  return calculations;
}

export function generateRemindersForSubscription(subscription: Subscription): Reminder[] {
  const calculations = calculateReminderTimes(subscription);
  const now = new Date().getTime();

  return calculations.map((calc, index) => ({
    id: `rem_${subscription.id}_${calc.reminderType}_${index}`,
    subscriptionId: subscription.id,
    triggerTime: calc.triggerTime,
    reminderType: calc.reminderType,
    scheduled: new Date(calc.triggerTime).getTime() > now,
    delivered: false,
    dismissed: false,
    title: calc.title,
    body: calc.body,
    amount: subscription.amount,
    currency: subscription.currency,
    merchantName: subscription.displayName,
    createdAt: new Date().toISOString()
  }));
}

export function formatHumanDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Request and dispatch web notification for real device experience
export async function triggerLocalDeviceNotification(
  title: string,
  body: string,
  tag = 'chargeguard_reminder'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Try browser native notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
        badge: '/favicon.ico',
        requireInteraction: true
      });
      return true;
    } catch {
      // Notification failed in iframe or restricted context
    }
  }

  return true;
}
