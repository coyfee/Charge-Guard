import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Bell, 
  Lock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  Subscription, 
  BillingFrequency, 
  Category, 
  ReminderType 
} from '../types';
import { normalizeMerchant } from '../services/merchantNormalization';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: Subscription) => void;
  initialSubscription?: Subscription;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSubscription
}) => {
  const [merchantName, setMerchantName] = useState(initialSubscription?.displayName || '');
  const [amount, setAmount] = useState(initialSubscription?.amount?.toString() || '149');
  const [currency, setCurrency] = useState(initialSubscription?.currency || 'PHP');
  const [frequency, setFrequency] = useState<BillingFrequency>(initialSubscription?.billingFrequency || 'MONTHLY');
  
  // Default renewal date to tomorrow or 30 days from now
  const defaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [renewalDate, setRenewalDate] = useState(initialSubscription?.nextRenewalDate || defaultDate());
  const [category, setCategory] = useState<Category>(initialSubscription?.category || 'STREAMING');
  const [isTrial, setIsTrial] = useState(initialSubscription?.isTrial || false);
  const [last4, setLast4] = useState(initialSubscription?.paymentMethodLast4 || '');
  const [notes, setNotes] = useState(initialSubscription?.notes || '');
  
  const [alerts, setAlerts] = useState<Record<ReminderType, boolean>>({
    'SEVEN_DAYS': initialSubscription ? initialSubscription.enabledAlerts.includes('SEVEN_DAYS') : true,
    'THREE_DAYS': initialSubscription ? initialSubscription.enabledAlerts.includes('THREE_DAYS') : true,
    'TWENTY_FOUR_HOURS': initialSubscription ? initialSubscription.enabledAlerts.includes('TWENTY_FOUR_HOURS') : true,
    'ONE_HOUR': initialSubscription ? initialSubscription.enabledAlerts.includes('ONE_HOUR') : false,
    'DAY_OF': initialSubscription ? initialSubscription.enabledAlerts.includes('DAY_OF') : true,
    'CUSTOM': false
  });

  if (!isOpen) return null;

  const handleMerchantBlur = () => {
    if (!initialSubscription && merchantName.trim()) {
      const normalized = normalizeMerchant(merchantName);
      setCategory(normalized.category);
      if (normalized.defaultAmount && (!amount || amount === '149')) {
        setAmount(normalized.defaultAmount.toString());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName.trim() || !amount || parseFloat(amount) <= 0) return;

    const enabledList = (Object.keys(alerts) as ReminderType[]).filter(k => alerts[k]);
    const normalized = normalizeMerchant(merchantName);

    const subscription: Subscription = {
      id: initialSubscription?.id || `sub_${Date.now()}`,
      merchantName: normalized.canonicalName.toLowerCase(),
      displayName: merchantName.trim(),
      category,
      amount: parseFloat(amount),
      currency,
      billingFrequency: frequency,
      nextRenewalDate: renewalDate,
      status: isTrial ? 'TRIAL' : (initialSubscription?.status || 'CONFIRMED'),
      source: initialSubscription?.source || 'MANUAL',
      confidence: initialSubscription?.confidence || 100,
      isPrediction: initialSubscription?.isPrediction || false,
      isTrial,
      trialEndsAt: isTrial ? renewalDate : undefined,
      paymentMethodLast4: last4.replace(/[^0-9]/g, '').slice(0, 4) || undefined,
      notes: notes.trim() || undefined,
      enabledAlerts: enabledList,
      createdAt: initialSubscription?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(subscription);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 text-slate-100 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialSubscription ? 'Edit Subscription' : 'Add Subscription'}
              </h3>
              <p className="text-[11px] text-slate-400">Stored exclusively on your device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Merchant Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Merchant Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix, Spotify, Canva Pro"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              onBlur={handleMerchantBlur}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-sm"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Recurring Amount</label>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="549"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-sm font-mono"
              >
                <option value="PHP">₱ PHP</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="JPY">¥ JPY</option>
                <option value="SGD">S$ SGD</option>
              </select>
            </div>
          </div>

          {/* Frequency & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Billing Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BillingFrequency)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-xs"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-xs"
              >
                <option value="STREAMING">Streaming</option>
                <option value="PRODUCTIVITY">Productivity</option>
                <option value="CLOUD_STORAGE">Cloud Storage</option>
                <option value="AI_TOOLS">AI Tools</option>
                <option value="DEVELOPER">Developer</option>
                <option value="GAMING">Gaming</option>
                <option value="FITNESS">Fitness</option>
                <option value="UTILITIES">Utilities</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Next Renewal Date & Free Trial Toggle */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Next Renewal Date</span>
                <span className="text-[10px] text-slate-500 font-normal">Calculates reminder timings</span>
              </label>
              <input
                type="date"
                required
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 text-sm font-mono"
              />
            </div>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
              />
              <span className="text-xs text-amber-300 font-medium">
                This is a Free Trial (Warn me before converting to paid)
              </span>
            </label>
          </div>

          {/* Reminder Preferences Checkboxes */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
              <Bell size={14} className="text-emerald-400" />
              <span>Offline Pre-Charge Alerts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { type: 'SEVEN_DAYS' as ReminderType, label: '7 days before' },
                { type: 'THREE_DAYS' as ReminderType, label: '3 days before' },
                { type: 'TWENTY_FOUR_HOURS' as ReminderType, label: '24 hours before' },
                { type: 'ONE_HOUR' as ReminderType, label: '1 hour before' },
                { type: 'DAY_OF' as ReminderType, label: 'Day of renewal (9 AM)' },
              ].map(({ type, label }) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={alerts[type]}
                    onChange={() => setAlerts(prev => ({ ...prev, [type]: !prev[type] }))}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method Last 4 Digits & Security Callout */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Card / Payment Last 4 Digits (Optional)</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Lock size={10} /> Never ask full cards
              </span>
            </label>
            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 4821"
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 size={16} />
              <span>Save & Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
