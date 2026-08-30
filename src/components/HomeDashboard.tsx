import React from 'react';
import { 
  ShieldCheck, 
  WifiOff, 
  Bell, 
  CreditCard, 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight,
  TrendingUp,
  Radio,
  Zap
} from 'lucide-react';
import { Subscription, Reminder } from '../types';
import { formatHumanDate } from '../services/reminderScheduler';

interface HomeDashboardProps {
  isOffline: boolean;
  subscriptions: Subscription[];
  reminders: Reminder[];
  onSelectSubscription: (sub: Subscription) => void;
  onNavigateTab: (tab: 'SUBSCRIPTIONS' | 'CALENDAR' | 'INSIGHTS' | 'SETTINGS') => void;
  onTriggerTestAlarm: (sub: Subscription) => void;
  onOpenSignalDetector: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  isOffline,
  subscriptions,
  reminders,
  onSelectSubscription,
  onNavigateTab,
  onTriggerTestAlarm,
  onOpenSignalDetector
}) => {
  // Sort active upcoming subscriptions by next renewal date
  const activeSubs = subscriptions.filter(s => s.status !== 'CANCELLED');
  const sortedUpcoming = [...activeSubs].sort(
    (a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime()
  );

  const nextRenewalSub = sortedUpcoming[0];
  const pendingRemindersCount = reminders.filter(r => !r.dismissed).length;

  // Calculate Spending Metrics
  const thisMonthSpend = activeSubs.reduce((acc, sub) => {
    if (sub.billingFrequency === 'YEARLY') {
      return acc + (sub.amount / 12);
    }
    return acc + sub.amount;
  }, 0);

  const estimatedYearlySpend = thisMonthSpend * 12;

  // Calculate upcoming 30 days actual billings
  const nowTime = new Date().getTime();
  const thirtyDaysFromNow = nowTime + 30 * 24 * 60 * 60 * 1000;
  const upcoming30DaysSpend = activeSubs
    .filter(s => {
      const t = new Date(s.nextRenewalDate).getTime();
      return t >= nowTime - 86400000 && t <= thirtyDaysFromNow;
    })
    .reduce((acc, s) => acc + s.amount, 0);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const formatCurrency = (val: number, curr = 'PHP') => {
    const symbol = curr === 'PHP' ? '₱' : curr === 'USD' ? '$' : curr;
    return `${symbol}${Math.round(val).toLocaleString()}`;
  };

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      {/* Top Greeting */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{greeting}</h2>
          <p className="text-xs text-slate-400">All local protection services armed</p>
        </div>
        <button
          onClick={onOpenSignalDetector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-emerald-400 hover:bg-slate-800 transition-colors"
        >
          <Radio size={12} className="animate-pulse text-emerald-400" />
          <span>Simulate Signal</span>
        </button>
      </div>

      {/* Primary Protection Status Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isOffline 
          ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 shadow-lg shadow-amber-950/20' 
          : 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOffline ? (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <WifiOff size={22} className="stroke-[2.5]" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck size={22} className="stroke-[2.5]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  {isOffline ? '📴 Offline Protection Active' : '🟢 Protection Active'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {isOffline 
                  ? 'Your scheduled reminders are still active without internet.' 
                  : 'Offline reminders: ON (Local SQLite armed)'}
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
            isOffline 
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/30' 
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
          }`}>
            {isOffline ? 'OFFLINE' : 'LOCAL'}
          </span>
        </div>

        {/* Protection Metric Counters */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-slate-400 text-[11px]">Monitored Subscriptions</span>
            <div className="text-lg font-bold text-white mt-0.5">{activeSubs.length} active</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-slate-400 text-[11px]">Scheduled Reminders</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{pendingRemindersCount} alarms</div>
          </div>
        </div>

        {/* Next Upcoming Renewal Callout Banner */}
        {nextRenewalSub && (
          <div 
            onClick={() => onSelectSubscription(nextRenewalSub)}
            className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                {nextRenewalSub.displayName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{nextRenewalSub.displayName}</span>
                  {nextRenewalSub.isTrial && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                      Trial Ending
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  Renews {formatHumanDate(nextRenewalSub.nextRenewalDate)} • <span className="text-emerald-400 font-semibold">{formatCurrency(nextRenewalSub.amount, nextRenewalSub.currency)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerTestAlarm(nextRenewalSub);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                title="Test local offline alarm immediately"
              >
                <Zap size={14} />
              </button>
              <ChevronRight size={16} className="text-slate-500" />
            </div>
          </div>
        )}
      </div>

      {/* Spending Summary Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Spending Overview</h3>
          <button 
            onClick={() => onNavigateTab('INSIGHTS')} 
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
          >
            Detailed Insights <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-medium">This month</span>
            <div className="text-sm font-extrabold text-white mt-1">
              {formatCurrency(thisMonthSpend)}
            </div>
            <span className="text-[10px] text-slate-500">recurring</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-medium">Estimated yearly</span>
            <div className="text-sm font-extrabold text-emerald-400 mt-1">
              {formatCurrency(estimatedYearlySpend)}
            </div>
            <span className="text-[10px] text-slate-500">annualized</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-medium">Next 30 days</span>
            <div className="text-sm font-extrabold text-teal-300 mt-1">
              {formatCurrency(upcoming30DaysSpend)}
            </div>
            <span className="text-[10px] text-slate-500">projected</span>
          </div>
        </div>
      </div>

      {/* Upcoming Renewals Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Renewals</h3>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
              {sortedUpcoming.length}
            </span>
          </div>
          <button 
            onClick={() => onNavigateTab('SUBSCRIPTIONS')} 
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
          >
            View All <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-2">
          {sortedUpcoming.slice(0, 5).map((sub) => {
            const isTomorrow = sub.nextRenewalDate === new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const isToday = sub.nextRenewalDate === new Date().toISOString().split('T')[0];

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubscription(sub)}
                className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-200 font-bold text-sm">
                    {sub.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{sub.displayName}</h4>
                      {sub.isPrediction && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Predicted
                        </span>
                      )}
                      {sub.isTrial && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Trial
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatHumanDate(sub.nextRenewalDate)}</span>
                      <span>•</span>
                      <span className="text-slate-400 capitalize">{sub.category.toLowerCase().replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="text-slate-500 text-[11px]">{sub.confidence}% conf</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-white">
                    {formatCurrency(sub.amount, sub.currency)}
                  </div>
                  <span className="text-[10px] text-slate-400">/{sub.billingFrequency.toLowerCase().slice(0, 2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
