export type BillingFrequency = 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'QUARTERLY' | 'SEMI_ANNUALLY';

export type SubscriptionStatus = 'CONFIRMED' | 'PREDICTED' | 'TRIAL' | 'CANCELLED' | 'PAUSED';

export type DetectionSource = 'MANUAL' | 'NOTIFICATION' | 'EMAIL' | 'SMS' | 'CALENDAR' | 'PREDICTION';

export type ReminderType = 
  | 'SEVEN_DAYS' 
  | 'THREE_DAYS' 
  | 'TWENTY_FOUR_HOURS' 
  | 'ONE_HOUR' 
  | 'DAY_OF' 
  | 'CUSTOM';

export type Category = 
  | 'STREAMING' 
  | 'PRODUCTIVITY' 
  | 'CLOUD_STORAGE' 
  | 'AI_TOOLS' 
  | 'GAMING' 
  | 'FITNESS' 
  | 'DEVELOPER' 
  | 'FINANCE' 
  | 'NEWS' 
  | 'UTILITIES' 
  | 'OTHER';

export interface Subscription {
  id: string;
  merchantName: string;
  displayName: string;
  category: Category;
  amount: number;
  currency: string;
  billingFrequency: BillingFrequency;
  nextRenewalDate: string; // ISO format: YYYY-MM-DD
  lastRenewalDate?: string;
  status: SubscriptionStatus;
  source: DetectionSource;
  confidence: number; // 0 - 100
  isPrediction: boolean;
  isTrial?: boolean;
  trialEndsAt?: string;
  previousAmount?: number;
  paymentMethodLast4?: string;
  notes?: string;
  enabledAlerts: ReminderType[];
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  subscriptionId: string;
  triggerTime: string; // ISO date-time string
  reminderType: ReminderType;
  scheduled: boolean;
  delivered: boolean;
  dismissed: boolean;
  title: string;
  body: string;
  amount: number;
  currency: string;
  merchantName: string;
  createdAt: string;
}

export interface RenewalEvent {
  id: string;
  subscriptionId: string;
  merchantName: string;
  eventDate: string;
  amount: number;
  currency: string;
  source: DetectionSource;
  fingerprint: string;
  notes?: string;
  createdAt: string;
}

export interface MerchantAlias {
  id: string;
  canonicalName: string;
  aliasPattern: string;
  defaultCategory: Category;
  iconName?: string;
}

export interface ParsedSignal {
  merchantName: string;
  normalizedName: string;
  amount: number;
  currency: string;
  renewalDate: string;
  billingFrequency: BillingFrequency;
  eventType: 'RENEWAL' | 'TRIAL_END' | 'PRICE_CHANGE' | 'UPCOMING_CHARGE' | 'ONE_TIME_IGNORE';
  paymentMethod?: string;
  rawText: string;
  source: DetectionSource;
  isIgnoredTransaction: boolean;
  ignoreReason?: string;
}

export interface ConfidenceScore {
  score: number;
  classification: 'CONFIRMED' | 'HIGH_CONFIDENCE' | 'PREDICTED' | 'IGNORE';
  reasons: string[];
}

export interface UserSettings {
  hasCompletedOnboarding: boolean;
  defaultCurrency: string;
  defaultAlerts: Record<ReminderType, boolean>;
  isOfflineSimulated: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  batteryOptimizationWarningAcknowledged: boolean;
  autoDetectFromNotifications: boolean;
  lastBootRecoveryAt?: string;
  lastScheduleVerificationAt?: string;
}

export interface OfflineHealthReport {
  databaseOk: boolean;
  schedulerOk: boolean;
  notificationPermissionOk: boolean;
  bootRecoveryOk: boolean;
  localParserOk: boolean;
  totalSubscriptions: number;
  activeRemindersCount: number;
  nextReminderTime: string | null;
  lastVerifiedAt: string;
}
