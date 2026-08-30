import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  XCircle,
  Calendar,
  Layers
} from 'lucide-react';
import { Subscription, SubscriptionStatus } from '../types';
import { formatHumanDate } from '../services/reminderScheduler';

type FilterTab = 'ALL' | 'UPCOMING' | 'TRIALS' | 'PREDICTED' | 'CONFIRMED' | 'CANCELLED';

interface SubscriptionsScreenProps {
  subscriptions: Subscription[];
  onSelectSubscription: (sub: Subscription) => void;
  onOpenAddModal: () => void;
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({
  subscriptions,
  onSelectSubscription,
  onOpenAddModal
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: 'ALL', label: 'All', count: subscriptions.length },
    { id: 'UPCOMING', label: 'Upcoming', count: subscriptions.filter(s => s.status !== 'CANCELLED').length },
    { id: 'TRIALS', label: 'Trials', count: subscriptions.filter(s => s.isTrial || s.status === 'TRIAL').length },
    { id: 'PREDICTED', label: 'Predicted', count: subscriptions.filter(s => s.isPrediction).length },
    { id: 'CONFIRMED', label: 'Confirmed', count: subscriptions.filter(s => s.status === 'CONFIRMED' && !s.isPrediction).length },
    { id: 'CANCELLED', label: 'Cancelled', count: subscriptions.filter(s => s.status === 'CANCELLED').length },
  ];

  const filteredSubs = subscriptions.filter((sub) => {
    // Search query filter
    const matchesSearch = 
      sub.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    switch (activeFilter) {
      case 'UPCOMING':
        return sub.status !== 'CANCELLED';
      case 'TRIALS':
        return sub.isTrial || sub.status === 'TRIAL';
      case 'PREDICTED':
        return sub.isPrediction;
      case 'CONFIRMED':
        return sub.status === 'CONFIRMED' && !sub.isPrediction;
      case 'CANCELLED':
        return sub.status === 'CANCELLED';
      case 'ALL':
      default:
        return true;
    }
  }).sort((a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime());

  const formatCurrency = (val: number, curr = 'PHP') => {
    const symbol = curr === 'PHP' ? '₱' : curr === 'USD' ? '$' : curr;
    return `${symbol}${Math.round(val).toLocaleString()}`;
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Search and Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriptions or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-emerald-500 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all shrink-0"
        >
          <Plus size={15} className="stroke-[3]" />
          <span>Add</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subscription Cards List */}
      {filteredSubs.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <CreditCard size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">No subscriptions yet.</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Add your first subscription and we'll remind you before it renews.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} className="stroke-[3]" /> Add Subscription
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSubs.map((sub) => {
            const isTrial = sub.isTrial || sub.status === 'TRIAL';
            const isCancelled = sub.status === 'CANCELLED';

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubscription(sub)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isCancelled
                    ? 'bg-slate-900/30 border-slate-800/40 opacity-60'
                    : isTrial
                      ? 'bg-slate-900/80 border-amber-500/30 hover:border-amber-500/50'
                      : sub.isPrediction
                        ? 'bg-slate-900/80 border-purple-500/30 hover:border-purple-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200">
                      {sub.displayName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{sub.displayName}</h4>
                        {isCancelled && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-800/50">
                            Cancelled
                          </span>
                        )}
                        {isTrial && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
                            Trial Ending
                          </span>
                        )}
                        {sub.isPrediction && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                            Predicted
                          </span>
                        )}
                        {sub.status === 'CONFIRMED' && !sub.isPrediction && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                            Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Renews {formatHumanDate(sub.nextRenewalDate)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-white">
                      {formatCurrency(sub.amount, sub.currency)}
                    </div>
                    <span className="text-[10px] text-slate-400 lowercase">
                      / {sub.billingFrequency}
                    </span>
                  </div>
                </div>

                {/* Footer Badges */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{sub.category.toLowerCase().replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400">{sub.confidence}% Confidence</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Source: {sub.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
