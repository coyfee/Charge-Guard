import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  PiggyBank, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react';
import { Subscription, Category } from '../types';
import { formatHumanDate } from '../services/reminderScheduler';

interface InsightsScreenProps {
  subscriptions: Subscription[];
  onSelectSubscription: (sub: Subscription) => void;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  subscriptions,
  onSelectSubscription
}) => {
  const activeSubs = subscriptions.filter(s => s.status !== 'CANCELLED');

  // Spend calculations
  const monthlySpend = activeSubs.reduce((acc, s) => {
    return acc + (s.billingFrequency === 'YEARLY' ? s.amount / 12 : s.amount);
  }, 0);

  const annualSpend = monthlySpend * 12;

  // Upcoming 30 days
  const now = Date.now();
  const thirtyDays = now + 30 * 24 * 60 * 60 * 1000;
  const upcoming30Spend = activeSubs
    .filter(s => {
      const t = new Date(s.nextRenewalDate).getTime();
      return t >= now - 86400000 && t <= thirtyDays;
    })
    .reduce((acc, s) => acc + s.amount, 0);

  // Category breakdown
  const categoryTotals: Partial<Record<Category, number>> = {};
  for (const s of activeSubs) {
    const cost = s.billingFrequency === 'YEARLY' ? s.amount / 12 : s.amount;
    categoryTotals[s.category] = (categoryTotals[s.category] || 0) + cost;
  }

  const categoryEntries = (Object.entries(categoryTotals) as Array<[Category, number]>)
    .sort((a, b) => b[1] - a[1]);

  // Price changes detected
  const priceChanges = activeSubs.filter(s => s.previousAmount && s.previousAmount !== s.amount);

  // Trials ending
  const trialsEnding = activeSubs.filter(s => s.isTrial || s.status === 'TRIAL');

  // Predictions
  const predictions = activeSubs.filter(s => s.isPrediction);

  // Potential savings (Trials + duplicate categories)
  const potentialSavingsMonthly = trialsEnding.reduce((acc, s) => acc + s.amount, 0);

  const formatCurrency = (val: number, curr = 'PHP') => {
    const symbol = curr === 'PHP' ? '₱' : curr === 'USD' ? '$' : curr;
    return `${symbol}${Math.round(val).toLocaleString()}`;
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Spend Highlights Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Monthly Cost</span>
            <div className="text-2xl font-black text-white mt-0.5">
              {formatCurrency(monthlySpend)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Annual Projection</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {formatCurrency(annualSpend)}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Upcoming 30-day billings:</span>
          <span className="font-bold text-teal-300 font-mono">{formatCurrency(upcoming30Spend)}</span>
        </div>
      </div>

      {/* Trial Protection Alerts (Section 21) */}
      {trialsEnding.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert size={18} className="stroke-[2.5]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Free Trial Protection</h4>
          </div>

          <div className="space-y-2">
            {trialsEnding.map(t => (
              <div 
                key={t.id}
                onClick={() => onSelectSubscription(t)}
                className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/30 cursor-pointer hover:border-amber-500/60 transition-all space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{t.displayName}</span>
                  <span className="font-extrabold text-amber-300">{formatCurrency(t.amount, t.currency)}</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  ⚠️ Your free trial may become a paid subscription on {formatHumanDate(t.nextRenewalDate)}.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Change Detection (Section 22) */}
      {priceChanges.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-orange-400">
            <AlertTriangle size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Detected Price Changes</h4>
          </div>

          <div className="space-y-2">
            {priceChanges.map(s => {
              const diff = s.amount - (s.previousAmount || 0);
              const pct = (((s.amount - (s.previousAmount || 0)) / (s.previousAmount || 1)) * 100).toFixed(1);

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSubscription(s)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{s.displayName}</div>
                    <div className="text-[11px] text-slate-400">
                      Previous: {formatCurrency(s.previousAmount || 0, s.currency)} → New: {formatCurrency(s.amount, s.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-500/30">
                      <ArrowUpRight size={12} /> +{pct}%
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">+{formatCurrency(diff, s.currency)}/mo</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Spending Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category Breakdown</h4>
          <span className="text-xs text-slate-400">{categoryEntries.length} categories</span>
        </div>

        <div className="space-y-2.5">
          {categoryEntries.map(([cat, amount]) => {
            const pct = Math.round((amount / (monthlySpend || 1)) * 100);

            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300 capitalize">
                    {cat.toLowerCase().replace('_', ' ')}
                  </span>
                  <div className="font-mono text-slate-200">
                    <span className="font-bold">{formatCurrency(amount)}</span>
                    <span className="text-[10px] text-slate-500 ml-1">({pct}%)</span>
                  </div>
                </div>
                {/* Visual percentage progress bar */}
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Potential Savings Insights */}
      {potentialSavingsMonthly > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <PiggyBank size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Potential Savings Opportunity</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cancelling ending trials ({trialsEnding.map(t => t.displayName).join(', ')}) before renewal would prevent <span className="font-bold text-emerald-400">{formatCurrency(potentialSavingsMonthly)}</span> in upcoming recurring monthly charges.
          </p>
        </div>
      )}
    </div>
  );
};
