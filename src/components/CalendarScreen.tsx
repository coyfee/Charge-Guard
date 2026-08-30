import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Subscription } from '../types';
import { formatHumanDate } from '../services/reminderScheduler';

interface CalendarScreenProps {
  subscriptions: Subscription[];
  onSelectSubscription: (sub: Subscription) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  subscriptions,
  onSelectSubscription
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, monthIndex - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, monthIndex + 1, 1));
    setSelectedDay(1);
  };

  // Days calculations
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Map subscriptions to days in this month
  const activeSubs = subscriptions.filter(s => s.status !== 'CANCELLED');
  
  const getSubsForDay = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = monthIndex + 1 < 10 ? `0${monthIndex + 1}` : `${monthIndex + 1}`;
    const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return activeSubs.filter(sub => {
      // Direct date match or recurring day of month
      if (sub.nextRenewalDate === targetDateStr) return true;

      // Check recurring day of month for monthly subscriptions
      const subParts = sub.nextRenewalDate.split('-');
      if (subParts.length === 3 && sub.billingFrequency === 'MONTHLY') {
        const subDay = parseInt(subParts[2], 10);
        return subDay === day;
      }
      return false;
    });
  };

  // Total month spending projection
  const totalMonthSpend = activeSubs.reduce((acc, sub) => {
    return acc + (sub.billingFrequency === 'YEARLY' ? sub.amount / 12 : sub.amount);
  }, 0);

  const selectedDaySubs = getSubsForDay(selectedDay);

  const formatCurrency = (val: number, curr = 'PHP') => {
    const symbol = curr === 'PHP' ? '₱' : curr === 'USD' ? '$' : curr;
    return `${symbol}${Math.round(val).toLocaleString()}`;
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Month Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <h3 className="font-extrabold text-base text-white">{monthName}</h3>
          <p className="text-[11px] text-emerald-400 font-mono">
            {formatCurrency(totalMonthSpend)} estimated renewals
          </p>
        </div>

        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar Grid (Generated entirely from local Room SQLite) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty prefix cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-11 rounded-lg bg-slate-950/20" />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const daySubs = getSubsForDay(day);
            const isSelected = day === selectedDay;
            const hasTrial = daySubs.some(s => s.isTrial);
            const hasPredicted = daySubs.some(s => s.isPrediction);
            const hasConfirmed = daySubs.some(s => s.status === 'CONFIRMED' && !s.isPrediction && !s.isTrial);

            const isToday = 
              new Date().getDate() === day && 
              new Date().getMonth() === monthIndex && 
              new Date().getFullYear() === year;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between text-xs transition-all relative ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/30'
                    : isToday
                      ? 'bg-slate-800 border border-emerald-500/50 text-white'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <span className={`text-[11px] ${isSelected ? 'text-slate-950' : isToday ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                  {day}
                </span>

                {/* Subscriptions Marker Dots */}
                <div className="flex items-center gap-0.5 mt-auto mb-0.5">
                  {hasConfirmed && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400'}`} />
                  )}
                  {hasTrial && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-amber-400'}`} />
                  )}
                  {hasPredicted && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-purple-400'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Trial Ending
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Predicted
          </span>
        </div>
      </div>

      {/* Selected Day Renewal Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {monthName.split(' ')[0]} {selectedDay} Schedule
          </h4>
          <span className="text-xs text-emerald-400 font-mono font-bold">
            {selectedDaySubs.length} renewal{selectedDaySubs.length === 1 ? '' : 's'}
          </span>
        </div>

        {selectedDaySubs.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500">
            No subscription renewals scheduled for this day.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDaySubs.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onSelectSubscription(sub)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {sub.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{sub.displayName}</span>
                      {sub.isTrial && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">
                          Trial
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {sub.billingFrequency.toLowerCase()} • {sub.confidence}% conf
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {formatCurrency(sub.amount, sub.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
