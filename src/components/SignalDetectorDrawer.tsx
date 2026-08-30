import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  ShieldAlert,
  Copy,
  Plus
} from 'lucide-react';
import { Subscription } from '../types';
import { parseSubscriptionSignal } from '../services/localParser';
import { calculateConfidence } from '../services/confidenceEngine';
import { isDuplicateSignal, createEventFingerprint } from '../services/duplicateDetector';
import { localDb } from '../db/localDatabase';
import { normalizeMerchant } from '../services/merchantNormalization';

interface SignalDetectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  existingSubscriptions: Subscription[];
  onSubscriptionAdded: (sub: Subscription) => void;
}

const SAMPLE_SIGNALS = [
  {
    label: 'Netflix Renewal (₱549)',
    text: 'Your Netflix Standard subscription will renew automatically tomorrow for ₱549.00 on Visa card ending in 4821.'
  },
  {
    label: 'Canva Free Trial Expiring (₱799)',
    text: 'Canva Pro: Your free trial ends in 2 days. You will be charged ₱799.00 on Sep 2 unless cancelled.'
  },
  {
    label: 'Spotify Price Change (₱149)',
    text: 'Spotify Premium rate update: Your plan price is changing to ₱149.00/month next renewal on Sep 7.'
  },
  {
    label: 'One-Time Delivery (Ignored)',
    text: 'GrabFood: Order delivered! One-time payment of ₱320.00 processed via Maya.'
  },
  {
    label: 'Google One Renewal (₱99)',
    text: 'Google One: Next upcoming payment of ₱99.00 is scheduled for Sep 2, 2026 for 100GB cloud storage.'
  },
  {
    label: 'Bank Transfer (Ignored)',
    text: 'Bank Alert: Successful fund transfer of ₱2,500.00 to Maria Santos at 14:22.'
  }
];

export const SignalDetectorDrawer: React.FC<SignalDetectorDrawerProps> = ({
  isOpen,
  onClose,
  existingSubscriptions,
  onSubscriptionAdded
}) => {
  const [inputText, setInputText] = useState(SAMPLE_SIGNALS[0].text);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsed = parseSubscriptionSignal(inputText, 'NOTIFICATION');
  const confidence = calculateConfidence(parsed, existingSubscriptions);
  const existingEvents = localDb.getAllRenewalEvents();
  const dupCheck = isDuplicateSignal(parsed, existingEvents);

  const handleApplySample = (text: string) => {
    setInputText(text);
    setSaveSuccessMessage(null);
  };

  const handleSaveToDatabase = () => {
    if (parsed.isIgnoredTransaction || !parsed.amount || parsed.amount <= 0) return;

    const normalized = normalizeMerchant(parsed.merchantName);
    const existing = existingSubscriptions.find(
      s => s.merchantName.toLowerCase() === normalized.canonicalName.toLowerCase()
    );

    const sub: Subscription = {
      id: existing?.id || `sub_${Date.now()}`,
      merchantName: normalized.canonicalName.toLowerCase(),
      displayName: normalized.canonicalName,
      category: normalized.category,
      amount: parsed.amount,
      currency: parsed.currency,
      billingFrequency: parsed.billingFrequency,
      nextRenewalDate: parsed.renewalDate,
      status: parsed.eventType === 'TRIAL_END' ? 'TRIAL' : 'CONFIRMED',
      source: 'NOTIFICATION',
      confidence: confidence.score,
      isPrediction: false,
      isTrial: parsed.eventType === 'TRIAL_END',
      trialEndsAt: parsed.eventType === 'TRIAL_END' ? parsed.renewalDate : undefined,
      paymentMethodLast4: parsed.paymentMethod?.replace(/[^0-9]/g, '').slice(0, 4),
      notes: `Captured on-device from notification signal.`,
      enabledAlerts: ['SEVEN_DAYS', 'THREE_DAYS', 'TWENTY_FOUR_HOURS', 'DAY_OF'],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to local database
    localDb.saveSubscription(sub);

    // Add renewal event
    localDb.addRenewalEvent({
      id: `rev_${Date.now()}`,
      subscriptionId: sub.id,
      merchantName: sub.displayName,
      eventDate: sub.nextRenewalDate,
      amount: sub.amount,
      currency: sub.currency,
      source: 'NOTIFICATION',
      fingerprint: createEventFingerprint(sub.displayName, sub.amount, sub.currency, sub.nextRenewalDate, parsed.eventType),
      createdAt: new Date().toISOString()
    });

    onSubscriptionAdded(sub);
    setSaveSuccessMessage(`✓ Armed offline protection alarms for ${sub.displayName}!`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Local Signal Parser</h3>
              <p className="text-[11px] text-slate-400">Zero-cloud on-device signal intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preset Sample Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Test Preset Signal Scenarios
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {SAMPLE_SIGNALS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleApplySample(s.text)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 whitespace-nowrap text-[11px] font-medium"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Area */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300">Incoming Notification / SMS Text</label>
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setSaveSuccessMessage(null);
            }}
            placeholder="Paste or type SMS or notification text..."
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs text-slate-100 font-sans"
          />
        </div>

        {/* Parser Results Card */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          parsed.isIgnoredTransaction 
            ? 'bg-slate-950 border-slate-800 text-slate-400' 
            : 'bg-slate-950 border-emerald-500/30 text-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Extraction Output
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              parsed.isIgnoredTransaction
                ? 'bg-slate-800 text-slate-400'
                : confidence.classification === 'CONFIRMED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-purple-950 text-purple-400 border border-purple-500/30'
            }`}>
              {confidence.score}% {confidence.classification}
            </span>
          </div>

          {parsed.isIgnoredTransaction ? (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" />
                <span>Non-Subscription Transaction Ignored</span>
              </div>
              <p className="text-[11px] text-slate-400">{parsed.ignoreReason}</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Merchant</span>
                  <div className="font-bold text-white text-sm">{parsed.normalizedName}</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Amount</span>
                  <div className="font-bold text-emerald-400 text-sm font-mono">
                    {parsed.currency} {parsed.amount.toLocaleString()}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Renewal Date</span>
                  <div className="font-bold text-white text-xs font-mono">{parsed.renewalDate}</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Event Type</span>
                  <div className="font-bold text-teal-300 text-xs uppercase">{parsed.eventType}</div>
                </div>
              </div>

              {/* Confidence Breakdown Reasons */}
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Scoring Breakdown:</span>
                {confidence.reasons.map((r, i) => (
                  <div key={i} className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                    {r}
                  </div>
                ))}
              </div>

              {/* Deduplication Status */}
              {dupCheck.isDuplicate && (
                <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 text-[11px]">
                  ℹ️ Duplicate filter: Similar signal already registered for {dupCheck.matchedEvent?.merchantName}.
                </div>
              )}
            </div>
          )}
        </div>

        {saveSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fadeIn">
            {saveSuccessMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Close
          </button>

          {!parsed.isIgnoredTransaction && parsed.amount > 0 && (
            <button
              onClick={handleSaveToDatabase}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 size={16} />
              <span>Schedule Protection</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
