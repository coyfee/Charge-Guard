import React, { useState, useEffect } from 'react';
import { 
  TopAppBar, 
  BottomNavigationBar, 
  TabType 
} from './components/Navigation';
import { OnboardingFlow } from './components/OnboardingFlow';
import { HomeDashboard } from './components/HomeDashboard';
import { SubscriptionsScreen } from './components/SubscriptionsScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AddSubscriptionModal } from './components/AddSubscriptionModal';
import { SubscriptionDetailModal } from './components/SubscriptionDetailModal';
import { SignalDetectorDrawer } from './components/SignalDetectorDrawer';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { NotificationToast, ActiveToast } from './components/NotificationToast';

import { Subscription, Reminder, RenewalEvent, UserSettings, ReminderType } from './types';
import { localDb } from './db/localDatabase';
import { triggerLocalDeviceNotification, formatHumanDate } from './services/reminderScheduler';

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => localDb.getSettings());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => localDb.getAllSubscriptions());
  const [reminders, setReminders] = useState<Reminder[]>(() => localDb.getAllReminders());
  const [renewalEvents, setRenewalEvents] = useState<RenewalEvent[]>(() => localDb.getAllRenewalEvents());
  
  const [currentTab, setCurrentTab] = useState<TabType>('HOME');
  const [isOffline, setIsOffline] = useState(settings.isOfflineSimulated);

  // Modals and Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>(undefined);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isDetectorOpen, setIsDetectorOpen] = useState(false);
  const [isAndroidCodeOpen, setIsAndroidCodeOpen] = useState(false);

  // Heads-up alert toast
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);

  // Refresh DB state
  const refreshState = () => {
    setSubscriptions(localDb.getAllSubscriptions());
    setReminders(localDb.getAllReminders());
    setRenewalEvents(localDb.getAllRenewalEvents());
    setSettings(localDb.getSettings());
  };

  // Toggle Simulated Offline Airplane Mode
  const handleToggleOffline = () => {
    const nextVal = !isOffline;
    setIsOffline(nextVal);
    localDb.updateSettings({ isOfflineSimulated: nextVal });
    
    // Show toast
    setActiveToast({
      id: `toast_offline_${Date.now()}`,
      title: nextVal ? '📴 Offline Protection Mode: ON' : '🟢 Online Mode Active',
      body: nextVal 
        ? 'Airplane Mode simulated. Scheduled reminders will continue firing without internet.'
        : 'Device connected. Local database remains the source of truth.',
      timestamp: new Date().toISOString()
    });
  };

  // Complete Onboarding
  const handleCompleteOnboarding = (alerts: Record<ReminderType, boolean>) => {
    localDb.updateSettings({
      hasCompletedOnboarding: true,
      defaultAlerts: alerts
    });
    refreshState();
  };

  // Save Subscription (Create or Edit)
  const handleSaveSubscription = (sub: Subscription) => {
    localDb.saveSubscription(sub);
    refreshState();
    
    setActiveToast({
      id: `toast_save_${Date.now()}`,
      title: `🛡️ Protection Armed: ${sub.displayName}`,
      body: `Scheduled local pre-charge renewal alerts for ${sub.currency === 'PHP' ? '₱' : sub.currency} ${sub.amount}.`,
      subscription: sub,
      timestamp: new Date().toISOString()
    });
  };

  // Delete Subscription
  const handleDeleteSubscription = (id: string) => {
    localDb.deleteSubscription(id);
    refreshState();
  };

  // Snooze Subscription (push renewal 7 days)
  const handleSnoozeSubscription = (sub: Subscription) => {
    const d = new Date(sub.nextRenewalDate);
    d.setDate(d.getDate() + 7);
    const newDate = d.toISOString().split('T')[0];

    const updated: Subscription = {
      ...sub,
      nextRenewalDate: newDate
    };
    localDb.saveSubscription(updated);
    refreshState();
    setSelectedSubscription(updated);

    setActiveToast({
      id: `toast_snooze_${Date.now()}`,
      title: `⏰ ${sub.displayName} Snoozed`,
      body: `Renewal warning postponed to ${formatHumanDate(newDate)}.`,
      subscription: updated,
      timestamp: new Date().toISOString()
    });
  };

  // Toggle Subscription Status (Cancel vs Confirm)
  const handleToggleStatus = (sub: Subscription) => {
    const isNowCancelled = sub.status !== 'CANCELLED';
    const updated: Subscription = {
      ...sub,
      status: isNowCancelled ? 'CANCELLED' : 'CONFIRMED'
    };
    localDb.saveSubscription(updated);
    refreshState();
    setSelectedSubscription(updated);
  };

  // Trigger Immediate Test Alarm (Section 24 Scenario)
  const handleTriggerTestAlarm = (sub: Subscription) => {
    const formattedCurrency = sub.currency === 'PHP' ? '₱' : (sub.currency === 'USD' ? '$' : sub.currency);
    const title = `🚨 ${sub.displayName} renews tomorrow!`;
    const body = `Pre-charge alert: ${sub.displayName} (${formattedCurrency}${sub.amount.toLocaleString()}) renews tomorrow.`;

    triggerLocalDeviceNotification(title, body);

    setActiveToast({
      id: `toast_alarm_${Date.now()}`,
      title,
      body,
      subscription: sub,
      timestamp: new Date().toISOString()
    });
  };

  // Simulate Device Reboot Recovery (Section 25)
  const handleSimulateReboot = () => {
    const result = localDb.simulateBootRecovery();
    refreshState();
    
    setActiveToast({
      id: `toast_boot_${Date.now()}`,
      title: '🔄 BOOT_COMPLETED Handled',
      body: `Device reboot simulated. Restored ${result.restoredRemindersCount} local alarms from Room SQLite with zero internet!`,
      timestamp: new Date().toISOString()
    });
  };

  // Simulate Timezone Shift (Section 26)
  const handleSimulateTimezone = () => {
    const result = localDb.simulateTimezoneChange('Asia/Manila');
    refreshState();
    
    setActiveToast({
      id: `toast_tz_${Date.now()}`,
      title: '🌐 TIMEZONE_CHANGED Handled',
      body: `Device clock adjusted. Recalculated ${result.recalculatedCount} local reminder trigger times.`,
      timestamp: new Date().toISOString()
    });
  };

  // Reset Demo Database
  const handleResetData = () => {
    localDb.resetAllData();
    refreshState();
    setActiveToast({
      id: `toast_reset_${Date.now()}`,
      title: '✓ Database Reset',
      body: 'ChargeGuard local SQLite database restored to initial clean state.',
      timestamp: new Date().toISOString()
    });
  };

  // If onboarding not completed, render Onboarding Flow
  if (!settings.hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleCompleteOnboarding} />;
  }

  const healthReport = localDb.getOfflineHealthReport();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Heads-up Alarm Notification Toast */}
      <NotificationToast
        toast={activeToast}
        onDismiss={() => setActiveToast(null)}
        onViewSubscription={(sub) => setSelectedSubscription(sub)}
      />

      {/* Main Mobile App Frame */}
      <div className="w-full max-w-md bg-slate-950 min-h-screen relative flex flex-col border-x border-slate-800/40 shadow-2xl">
        {/* Top App Bar & Status Bar */}
        <TopAppBar
          isOffline={isOffline}
          onToggleOffline={handleToggleOffline}
          onOpenDetector={() => setIsDetectorOpen(true)}
        />

        {/* Tab Content Container */}
        <main className="flex-1 p-4 overflow-y-auto">
          {currentTab === 'HOME' && (
            <HomeDashboard
              isOffline={isOffline}
              subscriptions={subscriptions}
              reminders={reminders}
              onSelectSubscription={(sub) => setSelectedSubscription(sub)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onTriggerTestAlarm={handleTriggerTestAlarm}
              onOpenSignalDetector={() => setIsDetectorOpen(true)}
            />
          )}

          {currentTab === 'SUBSCRIPTIONS' && (
            <SubscriptionsScreen
              subscriptions={subscriptions}
              onSelectSubscription={(sub) => setSelectedSubscription(sub)}
              onOpenAddModal={() => {
                setEditingSubscription(undefined);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {currentTab === 'CALENDAR' && (
            <CalendarScreen
              subscriptions={subscriptions}
              onSelectSubscription={(sub) => setSelectedSubscription(sub)}
            />
          )}

          {currentTab === 'INSIGHTS' && (
            <InsightsScreen
              subscriptions={subscriptions}
              onSelectSubscription={(sub) => setSelectedSubscription(sub)}
            />
          )}

          {currentTab === 'SETTINGS' && (
            <SettingsScreen
              settings={settings}
              healthReport={healthReport}
              onUpdateSettings={(up) => {
                localDb.updateSettings(up);
                refreshState();
              }}
              onOpenAndroidCode={() => setIsAndroidCodeOpen(true)}
              onSimulateReboot={handleSimulateReboot}
              onSimulateTimezone={handleSimulateTimezone}
              onResetData={handleResetData}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNavigationBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isOffline={isOffline}
          onToggleOffline={handleToggleOffline}
          onOpenAddModal={() => {
            setEditingSubscription(undefined);
            setIsAddModalOpen(true);
          }}
          onOpenDetector={() => setIsDetectorOpen(true)}
          monitoredCount={subscriptions.filter(s => s.status !== 'CANCELLED').length}
        />

        {/* Add / Edit Subscription Modal */}
        <AddSubscriptionModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingSubscription(undefined);
          }}
          onSave={handleSaveSubscription}
          initialSubscription={editingSubscription}
        />

        {/* Subscription Detail Modal */}
        <SubscriptionDetailModal
          subscription={selectedSubscription}
          reminders={reminders}
          renewalEvents={renewalEvents}
          onClose={() => setSelectedSubscription(null)}
          onEdit={(sub) => {
            setSelectedSubscription(null);
            setEditingSubscription(sub);
            setIsAddModalOpen(true);
          }}
          onDelete={handleDeleteSubscription}
          onToggleStatus={handleToggleStatus}
          onSnooze={handleSnoozeSubscription}
          onTriggerTestAlarm={handleTriggerTestAlarm}
        />

        {/* Local Signal Detector Drawer */}
        <SignalDetectorDrawer
          isOpen={isDetectorOpen}
          onClose={() => setIsDetectorOpen(false)}
          existingSubscriptions={subscriptions}
          onSubscriptionAdded={(sub) => {
            refreshState();
          }}
        />

        {/* Android Native Kotlin Codebase Viewer */}
        <AndroidCodeModal
          isOpen={isAndroidCodeOpen}
          onClose={() => setIsAndroidCodeOpen(false)}
        />
      </div>
    </div>
  );
}
