import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Bell, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  PauseCircle, 
  PlayCircle,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import { Subscription, Reminder, RenewalEvent } from '../types';
import { formatHumanDate } from '../services/reminderScheduler';
import { predictNextRenewal } from '../services/predictionEngine';

interface SubscriptionDetailModalProps {
  subscription: Subscription | null;
  reminders: Reminder[];
  renewalEvents: RenewalEvent[];
  onClose: () => void;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (sub: Subscription) => void;
  onSnooze: (sub: Subscription) => void;
  onTriggerTestAlarm: (sub: Subscription) => void;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  subscription,
  reminders,
  renewalEvents,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
  onSnooze,
  onTriggerTestAlarm
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);

  if (!subscription) return null;

  const subReminders = reminders.filter(r => r.subscriptionId === subscription.id);
  const subEvents = renewalEvents.filter(e => e.subscriptionId === subscription.id);
  const predictionAnalysis = predictNextRenewal(subEvents, subscription);

  const formatCurrency = (val: number, curr = 'PHP') => {
    const symbol = curr === 'PHP' ? '₱' : curr === 'USD' ? '$' : curr;
    return `${symbol}${val.toLocaleString()}`;
  };

  const isCancelled = subscription.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-base">
              {subscription.displayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">{subscription.displayName}</h3>
              </div>
              <p className="text-xs text-slate-400 capitalize">{subscription.category.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Pricing and Status Grid */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Amount</span>
            <div className="text-xl font-black text-white mt-0.5">
              {formatCurrency(subscription.amount, subscription.currency)}
            </div>
            <span className="text-[11px] text-slate-400 lowercase">per {subscription.billingFrequency}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Next Renewal</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {formatHumanDate(subscription.nextRenewalDate)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                subscription.status === 'CONFIRMED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : subscription.status === 'TRIAL'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    : subscription.status === 'CANCELLED'
                      ? 'bg-red-950 text-red-300 border border-red-500/30'
                      : 'bg-purple-950 text-purple-300 border border-purple-500/30'
              }`}>
                {subscription.status}
              </span>
              <span className="text-[11px] text-slate-400">{subscription.confidence}% Conf.</span>
            </div>
          </div>
        </div>

        {/* "Why This Alert?" Explainer Card (Section 13) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <HelpCircle size={15} />
              <span>Why are we warning you?</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Source: {subscription.source}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            {subscription.isPrediction ? (
              <>
                <div className="flex items-center gap-2 text-purple-300">
                  <Sparkles size={14} className="shrink-0" />
                  <span>Renewal prediction model calculated from local history</span>
                </div>
                {predictionAnalysis?.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                    <span>•</span> <span>{r}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>Renewal notification signal processed on-device</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>Merchant normalized & matched to canonical profile</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>Exact renewal schedule extracted ({formatHumanDate(subscription.nextRenewalDate)})</span>
                </div>
              </>
            )}

            {subscription.paymentMethodLast4 && (
              <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
                <span>🔒 Payment method: Card ending in ****{subscription.paymentMethodLast4}</span>
              </div>
            )}

            {subscription.previousAmount && (
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2 mt-1">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Price change detected: Was {formatCurrency(subscription.previousAmount)}, now {formatCurrency(subscription.amount)}.</span>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Reminders List (Section 23) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Offline Alarms</h4>
            <span className="text-[10px] text-emerald-400 font-mono">AlarmManager Armed</span>
          </div>

          <div className="space-y-1.5">
            {subReminders.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                {isCancelled ? 'Reminders disabled for cancelled subscription' : 'No reminders armed'}
              </div>
            ) : (
              subReminders.map((rem) => {
                const triggerDate = new Date(rem.triggerTime);
                const isPast = triggerDate.getTime() < Date.now();

                return (
                  <div
                    key={rem.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isPast 
                        ? 'bg-slate-950/40 border-slate-800/40 text-slate-500' 
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bell size={14} className={isPast ? 'text-slate-600' : 'text-emerald-400'} />
                      <div>
                        <div className="font-semibold text-white">{rem.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Trigger: {triggerDate.toLocaleDateString()} {triggerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      isPast ? 'bg-slate-800 text-slate-500' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isPast ? 'Delivered' : 'Scheduled'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Immediate Test Alarm Trigger Button */}
        <button
          onClick={() => onTriggerTestAlarm(subscription)}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
        >
          <Zap size={14} />
          <span>Fire Immediate Offline Test Alarm</span>
        </button>

        {/* Action Buttons: Edit, Snooze, Cancel, Delete */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onEdit(subscription)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
          >
            <Edit3 size={15} />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onSnooze(subscription)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
            title="Postpone renewal date by 7 days"
          >
            <Clock size={15} />
            <span>Snooze</span>
          </button>

          <button
            onClick={() => onToggleStatus(subscription)}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
              isCancelled
                ? 'bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-950/50 hover:bg-amber-900/50 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isCancelled ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
            <span>{isCancelled ? 'Resume' : 'Cancel'}</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete ${subscription.displayName}? All local reminder alarms will be cancelled.`)) {
                onDelete(subscription.id);
                onClose();
              }
            }}
            className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/40 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
