import React from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  CalendarDays, 
  TrendingUp, 
  Settings, 
  Wifi, 
  WifiOff, 
  Plus,
  Radio
} from 'lucide-react';

export type TabType = 'HOME' | 'SUBSCRIPTIONS' | 'CALENDAR' | 'INSIGHTS' | 'SETTINGS';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onOpenAddModal: () => void;
  onOpenDetector: () => void;
  monitoredCount: number;
}

export const TopAppBar: React.FC<{
  isOffline: boolean;
  onToggleOffline: () => void;
  onOpenDetector: () => void;
}> = ({ isOffline, onToggleOffline, onOpenDetector }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      {/* Android Status Bar Simulation */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 px-1">
        <span>09:41</span>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full text-[10px] font-sans border border-amber-500/30">
              <WifiOff size={10} /> Airplane Mode ON
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full text-[10px] font-sans border border-emerald-500/30">
              <Wifi size={10} /> 5G Connected
            </span>
          )}
          <span>100%</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-900/30">
            <ShieldCheck size={20} className="text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white font-sans">ChargeGuard</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono border border-emerald-500/20">
                v1.0 Native
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">Offline Early-Warning System</p>
          </div>
        </div>

        {/* Quick Mode Toggle & Signal Detector */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDetector}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Open Notification Signal Parser & Simulator"
          >
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-medium">Detect Signal</span>
          </button>

          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-all border ${
              isOffline
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
            title="Toggle simulated Airplane Mode to verify offline reminder persistence"
          >
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span>{isOffline ? 'Offline' : 'Online'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNavigationBar: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal
}) => {
  const tabs = [
    { id: 'HOME' as TabType, label: 'Home', icon: ShieldCheck },
    { id: 'SUBSCRIPTIONS' as TabType, label: 'Subs', icon: CreditCard },
    { id: 'CALENDAR' as TabType, label: 'Calendar', icon: CalendarDays },
    { id: 'INSIGHTS' as TabType, label: 'Insights', icon: TrendingUp },
    { id: 'SETTINGS' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 max-w-md mx-auto px-3 py-2">
      <div className="flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-emerald-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-emerald-500/15 text-emerald-400' : ''}`}>
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Floating Add Button for fast manual entry */}
        <button
          onClick={onOpenAddModal}
          className="absolute -top-6 right-6 w-11 h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform"
          title="Add New Subscription Manually"
        >
          <Plus size={22} className="stroke-[3]" />
        </button>
      </div>
    </nav>
  );
};
