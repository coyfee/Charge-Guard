import React, { useEffect } from 'react';
import { ShieldAlert, BellRing, X, Clock, ExternalLink } from 'lucide-react';
import { Subscription } from '../types';

export interface ActiveToast {
  id: string;
  title: string;
  body: string;
  subscription?: Subscription;
  timestamp: string;
}

interface NotificationToastProps {
  toast: ActiveToast | null;
  onDismiss: () => void;
  onViewSubscription: (sub: Subscription) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onDismiss,
  onViewSubscription
}) => {
  useEffect(() => {
    if (toast) {
      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-3 animate-slideDown">
      <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/60 backdrop-blur-xl text-slate-100 space-y-2">
        {/* Android System Heads-Up Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <BellRing size={14} className="animate-bounce" />
            <span className="font-mono uppercase text-[10px] tracking-wider">ChargeGuard • Alarm Triggered</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Just now</span>
        </div>

        {/* Content */}
        <div className="space-y-0.5">
          <h4 className="text-sm font-extrabold text-white">{toast.title}</h4>
          <p className="text-xs text-slate-300 leading-snug">{toast.body}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <button
            onClick={onDismiss}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px]"
          >
            Dismiss
          </button>

          {toast.subscription && (
            <button
              onClick={() => {
                onViewSubscription(toast.subscription!);
                onDismiss();
              }}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
            >
              <span>View Alert</span>
              <ExternalLink size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
