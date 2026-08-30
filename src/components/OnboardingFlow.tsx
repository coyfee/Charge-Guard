import React, { useState } from 'react';
import { 
  ShieldCheck, 
  WifiOff, 
  BellRing, 
  Lock, 
  Sparkles, 
  Smartphone, 
  Database, 
  Clock, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReminderType } from '../types';

interface OnboardingFlowProps {
  onComplete: (selectedAlerts: Record<ReminderType, boolean>) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [alerts, setAlerts] = useState<Record<ReminderType, boolean>>({
    'SEVEN_DAYS': true,
    'THREE_DAYS': true,
    'TWENTY_FOUR_HOURS': true,
    'ONE_HOUR': false,
    'DAY_OF': true,
    'CUSTOM': false
  });

  const handleNext = () => {
    if (currentStep === 3) {
      // Fire confetti celebration on step 4
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#059669', '#6EE7B7']
        });
      } catch {
        // Fallback if canvas confetti restricted
      }
      setCurrentStep(4);
    } else if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
    } else {
      onComplete(alerts);
    }
  };

  const toggleAlert = (type: ReminderType) => {
    setAlerts(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 max-w-md mx-auto overflow-y-auto text-slate-100">
      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 py-3">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === currentStep 
                ? 'w-8 bg-emerald-500' 
                : step < currentStep 
                  ? 'w-3 bg-emerald-700/60' 
                  : 'w-3 bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Screen 1: Welcome & Value Prop */}
      {currentStep === 1 && (
        <div className="my-auto space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/30">
            <ShieldCheck size={36} className="text-slate-950 stroke-[2.5]" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
              Never be surprised by a subscription charge again.
            </h1>
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              Get warned before recurring payments — without connecting your bank.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <WifiOff size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Offline Reminders</h4>
                <p className="text-[11px] text-slate-400">Works without Wi-Fi or data</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <BellRing size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Pre-Charge Alerts</h4>
                <p className="text-[11px] text-slate-400">Timely warnings ahead of renewals</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <Lock size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Privacy-First</h4>
                <p className="text-[11px] text-slate-400">No bank logins or cloud storage</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <Sparkles size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Smart Predictions</h4>
                <p className="text-[11px] text-slate-400">Predicts future renewal intervals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Offline Architecture Diagram */}
      {currentStep === 2 && (
        <div className="my-auto space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 text-xs font-medium border border-emerald-500/30 mb-1">
              <WifiOff size={13} /> Zero Server Dependency
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Your reminders work offline.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Once a subscription reminder is scheduled, it stays on your device. Wi-Fi and mobile data are not required for the reminder.
            </p>
          </div>

          {/* Architecture Pipeline Diagram */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Smartphone size={18} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white">1. PHONE</span>
                <p className="text-[11px] text-slate-400">Subscription signal detected or entered manually</p>
              </div>
            </div>

            <div className="flex justify-center -my-1 text-emerald-500 font-bold">↓</div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Database size={18} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white">2. LOCAL DATABASE</span>
                <p className="text-[11px] text-slate-400">Persisted inside encrypted on-device SQLite (Room)</p>
              </div>
            </div>

            <div className="flex justify-center -my-1 text-emerald-500 font-bold">↓</div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Clock size={18} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white">3. LOCAL SCHEDULER</span>
                <p className="text-[11px] text-slate-400">Android AlarmManager exact wakeups scheduled</p>
              </div>
            </div>

            <div className="flex justify-center -my-1 text-emerald-500 font-bold">↓</div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <div className="p-2 rounded-lg bg-emerald-500 text-slate-950 font-bold">
                <BellRing size={18} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-emerald-300">4. GUARANTEED REMINDER</span>
                <p className="text-[11px] text-emerald-400/80">Fires accurately in Airplane Mode, Doze, or offline</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Choose Your Alerts */}
      {currentStep === 3 && (
        <div className="my-auto space-y-5 animate-fadeIn">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Choose your alerts
            </h2>
            <p className="text-xs text-slate-400">
              Configure when ChargeGuard should deliver pre-charge renewal warnings.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { type: 'SEVEN_DAYS' as ReminderType, label: '7 days before', desc: 'Allows time to evaluate renewal necessity' },
              { type: 'THREE_DAYS' as ReminderType, label: '3 days before', desc: 'Standard cancellation window reminder' },
              { type: 'TWENTY_FOUR_HOURS' as ReminderType, label: '24 hours before', desc: 'Urgent pre-charge early warning' },
              { type: 'ONE_HOUR' as ReminderType, label: '1 hour before', desc: 'Last-minute emergency notification' },
              { type: 'DAY_OF' as ReminderType, label: 'Day of renewal (9 AM)', desc: 'Confirmation of billing processing today' },
            ].map(({ type, label, desc }) => {
              const isChecked = alerts[type];
              return (
                <div
                  key={type}
                  onClick={() => toggleAlert(type)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white">{label}</h4>
                    <p className="text-[11px] text-slate-400">{desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isChecked ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 border border-slate-700'
                  }`}>
                    {isChecked && <CheckCircle2 size={16} className="stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen 4: Protection Activated */}
      {currentStep === 4 && (
        <div className="my-auto text-center space-y-6 animate-fadeIn">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-pulse">
              <ShieldCheck size={52} className="text-emerald-400 stroke-[2.5]" />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
              ONLINE & OFFLINE
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              🛡️ Protection Activated
            </h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
              Your scheduled subscription protection can now continue working without internet.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 size={16} /> Local Room SQLite DB ready
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 size={16} /> Offline Alarm Scheduler armed
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 size={16} /> Device Reboot Recovery enabled
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Button */}
      <div className="pt-4">
        <button
          onClick={handleNext}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all"
        >
          <span>
            {currentStep === 1 ? 'Get Started' : currentStep === 4 ? 'Open Dashboard' : 'Continue'}
          </span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
