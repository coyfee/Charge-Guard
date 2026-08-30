import { 
  Subscription, 
  Reminder, 
  RenewalEvent, 
  UserSettings, 
  OfflineHealthReport 
} from '../types';
import { generateRemindersForSubscription } from '../services/reminderScheduler';

const STORAGE_KEYS = {
  SUBSCRIPTIONS: 'chargeguard_subscriptions_v1',
  REMINDERS: 'chargeguard_reminders_v1',
  RENEWAL_EVENTS: 'chargeguard_renewal_events_v1',
  SETTINGS: 'chargeguard_settings_v1',
  LOGS: 'chargeguard_audit_logs_v1'
};

const DEFAULT_SETTINGS: UserSettings = {
  hasCompletedOnboarding: false,
  defaultCurrency: 'PHP',
  defaultAlerts: {
    'SEVEN_DAYS': true,
    'THREE_DAYS': true,
    'TWENTY_FOUR_HOURS': true,
    'ONE_HOUR': false,
    'DAY_OF': true,
    'CUSTOM': false
  },
  isOfflineSimulated: false,
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  batteryOptimizationWarningAcknowledged: true,
  autoDetectFromNotifications: true,
  lastBootRecoveryAt: new Date().toISOString(),
  lastScheduleVerificationAt: new Date().toISOString()
};

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_netflix_01',
    merchantName: 'netflix',
    displayName: 'Netflix Standard',
    category: 'STREAMING',
    amount: 549,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getTomorrowDate(),
    lastRenewalDate: getPastDate(29),
    status: 'CONFIRMED',
    source: 'NOTIFICATION',
    confidence: 98,
    isPrediction: false,
    paymentMethodLast4: '4821',
    notes: 'Premium 4K streaming plan. Renews automatically.',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS', 'DAY_OF'],
    createdAt: getPastDate(90),
    updatedAt: getPastDate(1)
  },
  {
    id: 'sub_google_one_02',
    merchantName: 'google one',
    displayName: 'Google One 100GB',
    category: 'CLOUD_STORAGE',
    amount: 99,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getDaysFromNow(3),
    lastRenewalDate: getPastDate(27),
    status: 'CONFIRMED',
    source: 'NOTIFICATION',
    confidence: 95,
    isPrediction: false,
    paymentMethodLast4: '9123',
    notes: 'Drive + Photos cloud backup.',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS'],
    createdAt: getPastDate(120),
    updatedAt: getPastDate(2)
  },
  {
    id: 'sub_canva_03',
    merchantName: 'canva',
    displayName: 'Canva Pro',
    category: 'PRODUCTIVITY',
    amount: 799,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getDaysFromNow(2),
    status: 'TRIAL',
    source: 'NOTIFICATION',
    confidence: 92,
    isPrediction: false,
    isTrial: true,
    trialEndsAt: getDaysFromNow(2),
    paymentMethodLast4: '4821',
    notes: 'Free 30-day trial ending soon. Cancel to avoid ₱799 charge.',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS', 'ONE_HOUR'],
    createdAt: getPastDate(28),
    updatedAt: getPastDate(1)
  },
  {
    id: 'sub_spotify_04',
    merchantName: 'spotify',
    displayName: 'Spotify Premium',
    category: 'STREAMING',
    amount: 149,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getDaysFromNow(8),
    lastRenewalDate: getPastDate(22),
    status: 'CONFIRMED',
    source: 'EMAIL',
    confidence: 90,
    isPrediction: false,
    paymentMethodLast4: '4821',
    notes: 'Individual music plan.',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS'],
    createdAt: getPastDate(180),
    updatedAt: getPastDate(5)
  },
  {
    id: 'sub_youtube_05',
    merchantName: 'youtube premium',
    displayName: 'YouTube Premium',
    category: 'STREAMING',
    amount: 239,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getDaysFromNow(12),
    lastRenewalDate: getPastDate(18),
    status: 'CONFIRMED',
    source: 'NOTIFICATION',
    confidence: 96,
    isPrediction: false,
    previousAmount: 189, // Price change example!
    paymentMethodLast4: '9123',
    notes: 'Price updated from ₱189 to ₱239 (+26.5%).',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS'],
    createdAt: getPastDate(200),
    updatedAt: getPastDate(3)
  },
  {
    id: 'sub_chatgpt_06',
    merchantName: 'chatgpt',
    displayName: 'ChatGPT Plus',
    category: 'AI_TOOLS',
    amount: 1150,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getDaysFromNow(17),
    lastRenewalDate: getPastDate(13),
    status: 'CONFIRMED',
    source: 'SMS',
    confidence: 88,
    isPrediction: false,
    paymentMethodLast4: '4821',
    notes: 'OpenAI subscription billing.',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS'],
    createdAt: getPastDate(150),
    updatedAt: getPastDate(4)
  },
  {
    id: 'sub_icloud_07',
    merchantName: 'apple',
    displayName: 'Apple iCloud+ 50GB',
    category: 'CLOUD_STORAGE',
    amount: 49,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getDaysFromNow(24),
    lastRenewalDate: getPastDate(6),
    status: 'CONFIRMED',
    source: 'MANUAL',
    confidence: 100,
    isPrediction: false,
    paymentMethodLast4: '4821',
    notes: 'Apple Family storage.',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS'],
    createdAt: getPastDate(300),
    updatedAt: getPastDate(10)
  },
  {
    id: 'sub_github_08',
    merchantName: 'github',
    displayName: 'GitHub Copilot',
    category: 'DEVELOPER',
    amount: 580,
    currency: 'PHP',
    billingFrequency: 'MONTHLY',
    nextRenewalDate: getDaysFromNow(28),
    status: 'PREDICTED',
    source: 'PREDICTION',
    confidence: 72,
    isPrediction: true,
    notes: 'Predicted from 3 consecutive recurring GitHub billing signals.',
    enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS'],
    createdAt: getPastDate(60),
    updatedAt: getPastDate(2)
  }
];

const INITIAL_RENEWAL_EVENTS: RenewalEvent[] = [
  // Netflix history (3 cycles for prediction engine)
  {
    id: 'rev_netflix_01',
    subscriptionId: 'sub_netflix_01',
    merchantName: 'Netflix',
    eventDate: getPastDate(89),
    amount: 549,
    currency: 'PHP',
    source: 'NOTIFICATION',
    fingerprint: 'netflix_54900_PHP_2026-06-03_RENEWAL',
    createdAt: getPastDate(89)
  },
  {
    id: 'rev_netflix_02',
    subscriptionId: 'sub_netflix_01',
    merchantName: 'Netflix',
    eventDate: getPastDate(59),
    amount: 549,
    currency: 'PHP',
    source: 'NOTIFICATION',
    fingerprint: 'netflix_54900_PHP_2026-07-03_RENEWAL',
    createdAt: getPastDate(59)
  },
  {
    id: 'rev_netflix_03',
    subscriptionId: 'sub_netflix_01',
    merchantName: 'Netflix',
    eventDate: getPastDate(29),
    amount: 549,
    currency: 'PHP',
    source: 'NOTIFICATION',
    fingerprint: 'netflix_54900_PHP_2026-08-03_RENEWAL',
    createdAt: getPastDate(29)
  },
  // Spotify history
  {
    id: 'rev_spotify_01',
    subscriptionId: 'sub_spotify_04',
    merchantName: 'Spotify',
    eventDate: getPastDate(52),
    amount: 149,
    currency: 'PHP',
    source: 'EMAIL',
    fingerprint: 'spotify_14900_PHP_2026-07-09_RENEWAL',
    createdAt: getPastDate(52)
  },
  {
    id: 'rev_spotify_02',
    subscriptionId: 'sub_spotify_04',
    merchantName: 'Spotify',
    eventDate: getPastDate(22),
    amount: 149,
    currency: 'PHP',
    source: 'EMAIL',
    fingerprint: 'spotify_14900_PHP_2026-08-08_RENEWAL',
    createdAt: getPastDate(22)
  },
  // YouTube history showing price change
  {
    id: 'rev_yt_01',
    subscriptionId: 'sub_youtube_05',
    merchantName: 'YouTube Premium',
    eventDate: getPastDate(48),
    amount: 189,
    currency: 'PHP',
    source: 'NOTIFICATION',
    fingerprint: 'yt_18900_PHP_2026-07-13_RENEWAL',
    createdAt: getPastDate(48)
  },
  {
    id: 'rev_yt_02',
    subscriptionId: 'sub_youtube_05',
    merchantName: 'YouTube Premium',
    eventDate: getPastDate(18),
    amount: 239,
    currency: 'PHP',
    source: 'NOTIFICATION',
    fingerprint: 'yt_23900_PHP_2026-08-12_RENEWAL',
    notes: 'Price adjustment took effect',
    createdAt: getPastDate(18)
  }
];

class LocalDatabase {
  private subscriptions: Subscription[] = [];
  private reminders: Reminder[] = [];
  private renewalEvents: RenewalEvent[] = [];
  private settings: UserSettings = DEFAULT_SETTINGS;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      const storedSubs = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      const storedReminders = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      const storedEvents = localStorage.getItem(STORAGE_KEYS.RENEWAL_EVENTS);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedSubs) {
        this.subscriptions = JSON.parse(storedSubs);
      } else {
        this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
        this.saveSubscriptions();
      }

      if (storedEvents) {
        this.renewalEvents = JSON.parse(storedEvents);
      } else {
        this.renewalEvents = [...INITIAL_RENEWAL_EVENTS];
        this.saveRenewalEvents();
      }

      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
        this.saveSettings();
      }

      if (storedReminders) {
        this.reminders = JSON.parse(storedReminders);
      } else {
        // Generate initial reminders for all subscriptions
        this.rescheduleAllReminders();
      }

      this.isInitialized = true;
    } catch (e) {
      console.error('ChargeGuard Room SQLite init failed, using in-memory fallbacks', e);
      this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
      this.renewalEvents = [...INITIAL_RENEWAL_EVENTS];
      this.settings = { ...DEFAULT_SETTINGS };
      this.rescheduleAllReminders();
    }
  }

  // ---------------- SUBSCRIPTIONS DAO ----------------
  public getAllSubscriptions(): Subscription[] {
    return [...this.subscriptions];
  }

  public getSubscriptionById(id: string): Subscription | undefined {
    return this.subscriptions.find(s => s.id === id);
  }

  public saveSubscription(sub: Subscription): Subscription {
    const existingIndex = this.subscriptions.findIndex(s => s.id === sub.id);
    const updatedSub = {
      ...sub,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.subscriptions[existingIndex] = updatedSub;
    } else {
      this.subscriptions.push(updatedSub);
    }

    this.saveSubscriptions();
    
    // Automatically recalculate and schedule offline reminders
    this.scheduleRemindersForSubscription(updatedSub);
    
    return updatedSub;
  }

  public deleteSubscription(id: string): boolean {
    const initialLen = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter(s => s.id !== id);
    this.reminders = this.reminders.filter(r => r.subscriptionId !== id);
    
    this.saveSubscriptions();
    this.saveReminders();
    return this.subscriptions.length < initialLen;
  }

  // ---------------- REMINDERS DAO ----------------
  public getAllReminders(): Reminder[] {
    return [...this.reminders];
  }

  public getActiveReminders(): Reminder[] {
    return this.reminders.filter(r => !r.dismissed);
  }

  public getRemindersForSubscription(subscriptionId: string): Reminder[] {
    return this.reminders.filter(r => r.subscriptionId === subscriptionId);
  }

  public scheduleRemindersForSubscription(subscription: Subscription): Reminder[] {
    // Remove existing pending reminders for this sub
    this.reminders = this.reminders.filter(r => r.subscriptionId !== subscription.id || r.delivered);
    
    if (subscription.status === 'CANCELLED') {
      this.saveReminders();
      return [];
    }

    const newReminders = generateRemindersForSubscription(subscription);
    this.reminders.push(...newReminders);
    this.saveReminders();
    return newReminders;
  }

  public markReminderDelivered(id: string): void {
    const reminder = this.reminders.find(r => r.id === id);
    if (reminder) {
      reminder.delivered = true;
      this.saveReminders();
    }
  }

  public dismissReminder(id: string): void {
    const reminder = this.reminders.find(r => r.id === id);
    if (reminder) {
      reminder.dismissed = true;
      this.saveReminders();
    }
  }

  public rescheduleAllReminders(): void {
    this.reminders = [];
    for (const sub of this.subscriptions) {
      if (sub.status !== 'CANCELLED') {
        const subReminders = generateRemindersForSubscription(sub);
        this.reminders.push(...subReminders);
      }
    }
    this.saveReminders();
  }

  // ---------------- RENEWAL EVENTS DAO ----------------
  public getAllRenewalEvents(): RenewalEvent[] {
    return [...this.renewalEvents];
  }

  public getEventsForSubscription(subscriptionId: string): RenewalEvent[] {
    return this.renewalEvents.filter(e => e.subscriptionId === subscriptionId);
  }

  public addRenewalEvent(event: RenewalEvent): RenewalEvent {
    this.renewalEvents.push(event);
    this.saveRenewalEvents();
    return event;
  }

  // ---------------- SETTINGS DAO ----------------
  public getSettings(): UserSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<UserSettings>): UserSettings {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    return { ...this.settings };
  }

  // ---------------- BOOT RECOVERY & TIMEZONE ----------------
  public simulateBootRecovery(): { restoredRemindersCount: number; timestamp: string } {
    this.rescheduleAllReminders();
    const now = new Date().toISOString();
    this.updateSettings({ lastBootRecoveryAt: now });
    return {
      restoredRemindersCount: this.reminders.filter(r => !r.delivered && !r.dismissed).length,
      timestamp: now
    };
  }

  public simulateTimezoneChange(newTz: string): { recalculatedCount: number } {
    this.rescheduleAllReminders();
    const now = new Date().toISOString();
    this.updateSettings({ lastScheduleVerificationAt: now });
    return {
      recalculatedCount: this.reminders.length
    };
  }

  // ---------------- HEALTH CHECK ----------------
  public getOfflineHealthReport(): OfflineHealthReport {
    const active = this.getActiveReminders();
    const upcoming = active
      .filter(r => !r.delivered)
      .sort((a, b) => new Date(a.triggerTime).getTime() - new Date(b.triggerTime).getTime());

    return {
      databaseOk: true,
      schedulerOk: true,
      notificationPermissionOk: this.settings.notificationsEnabled,
      bootRecoveryOk: !!this.settings.lastBootRecoveryAt,
      localParserOk: true,
      totalSubscriptions: this.subscriptions.length,
      activeRemindersCount: active.length,
      nextReminderTime: upcoming.length > 0 ? upcoming[0].triggerTime : null,
      lastVerifiedAt: this.settings.lastScheduleVerificationAt || new Date().toISOString()
    };
  }

  // ---------------- BACKUP & EXPORT ----------------
  public exportDatabaseJson(): string {
    return JSON.stringify({
      version: 1,
      appName: 'ChargeGuard',
      exportedAt: new Date().toISOString(),
      subscriptions: this.subscriptions,
      reminders: this.reminders,
      renewalEvents: this.renewalEvents,
      settings: this.settings
    }, null, 2);
  }

  public importDatabaseJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.subscriptions)) {
        this.subscriptions = data.subscriptions;
        this.saveSubscriptions();
      }
      if (Array.isArray(data.renewalEvents)) {
        this.renewalEvents = data.renewalEvents;
        this.saveRenewalEvents();
      }
      if (data.settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        this.saveSettings();
      }
      this.rescheduleAllReminders();
      return true;
    } catch {
      return false;
    }
  }

  public resetAllData(): void {
    this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
    this.renewalEvents = [...INITIAL_RENEWAL_EVENTS];
    this.settings = { ...DEFAULT_SETTINGS, hasCompletedOnboarding: true };
    this.saveSubscriptions();
    this.saveRenewalEvents();
    this.saveSettings();
    this.rescheduleAllReminders();
  }

  // ---------------- PRIVATE PERSISTENCE ----------------
  private saveSubscriptions(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(this.subscriptions));
    }
  }

  private saveReminders(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(this.reminders));
    }
  }

  private saveRenewalEvents(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.RENEWAL_EVENTS, JSON.stringify(this.renewalEvents));
    }
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    }
  }
}

export const localDb = new LocalDatabase();
