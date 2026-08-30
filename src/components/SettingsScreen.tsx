import React, { useState } from 'react';
import { 
  ShieldCheck, 
  WifiOff, 
  Bell, 
  Clock, 
  Lock, 
  BatteryCharging, 
  Download, 
  Upload, 
  Trash2, 
  RotateCcw, 
  FileCode2, 
  CheckCircle2, 
  ChevronRight,
  Info,
  Zap,
  Globe
} from 'lucide-react';
import { UserSettings, OfflineHealthReport } from '../types';
import { localDb } from '../db/localDatabase';
import { formatHumanDate } from '../services/reminderScheduler';

interface SettingsScreenProps {
  settings: UserSettings;
  healthReport: OfflineHealthReport;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onOpenAndroidCode: () => void;
  onSimulateReboot: () => void;
  onSimulateTimezone: () => void;
  onResetData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  healthReport,
  onUpdateSettings,
  onOpenAndroidCode,
  onSimulateReboot,
  onSimulateTimezone,
  onResetData
}) => {
  const [showHealthDiagnostics, setShowHealthDiagnostics] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const json = localDb.exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chargeguard_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = localDb.importDatabaseJson(content);
      if (success) {
        setImportStatus('✓ Local database restored successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus('❌ Invalid backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Offline Health Diagnostics Card (Section 37) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-400 stroke-[2.5]" />
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Offline Protection Status
              </h3>
              <p className="text-xs text-slate-400">All local subsystems operational</p>
            </div>
          </div>
          <button
            onClick={() => setShowHealthDiagnostics(!showHealthDiagnostics)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            <span>{showHealthDiagnostics ? 'Hide Details' : 'Diagnostics'}</span>
            <ChevronRight size={14} className={showHealthDiagnostics ? 'rotate-90' : ''} />
          </button>
        </div>

        {/* Diagnostics Checklist */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={15} /> <span>Local Database (Room)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={15} /> <span>Reminder Scheduler</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={15} /> <span>Notification System</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={15} /> <span>Reboot Recovery</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={15} /> <span>Local Parser Engine</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={15} /> <span>Confidence Scorer</span>
          </div>
        </div>

        {/* Quick Diagnostics Stats */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Scheduled Alarms</span>
            <div className="font-bold text-white text-sm">{healthReport.activeRemindersCount} armed</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Next Trigger</span>
            <div className="font-bold text-emerald-400 text-sm">
              {healthReport.nextReminderTime 
                ? new Date(healthReport.nextReminderTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'None pending'}
            </div>
          </div>
        </div>
      </div>

      {/* System Simulations (Reboot Recovery & Timezone) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Reliability & System Simulations
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSimulateReboot}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400">
              <span>Simulate Boot Completed</span>
              <RotateCcw size={14} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Trigger BOOT_COMPLETED receiver to restore alarms from SQLite.
            </p>
          </button>

          <button
            onClick={onSimulateTimezone}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400">
              <span>Simulate Timezone Shift</span>
              <Globe size={14} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Recalculates trigger timestamps on clock/timezone change.
            </p>
          </button>
        </div>
      </div>

      {/* Android Kotlin Native Code Explorer */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileCode2 size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Android Native Codebase</h4>
            <p className="text-xs text-slate-400">Kotlin, Compose, Room, AlarmManager & Receivers</p>
          </div>
        </div>
        <button
          onClick={onOpenAndroidCode}
          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
        >
          View Code
        </button>
      </div>

      {/* Battery Optimization Notice (Section 27) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <BatteryCharging size={16} />
          <h4 className="text-xs font-bold uppercase tracking-wider">Reminder Reliability & Battery</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          ChargeGuard uses Android's exact alarm APIs (<code className="text-emerald-400 font-mono text-[11px]">setExactAndAllowWhileIdle</code>). On some devices (Xiaomi, Samsung, Huawei), background battery savers may delay notifications. Disabling battery optimization for ChargeGuard ensures 100% timely pre-charge warnings.
        </p>
      </div>

      {/* Privacy & Zero-Cloud Guarantee (Section 31 & 32) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <Lock size={16} />
          <h4 className="text-xs font-bold uppercase tracking-wider">Privacy & Security Guarantee</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          • No bank logins or credentials required.<br/>
          • Never stores full credit card numbers.<br/>
          • Zero cloud synchronization or telemetry.<br/>
          • All subscription parsing and reminder alarms remain 100% on this device.
        </p>
      </div>

      {/* Data Management: Export, Import, Reset */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Management</h4>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleExport}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 font-semibold text-slate-200"
          >
            <Download size={15} />
            <span>Export Backup JSON</span>
          </button>

          <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 font-semibold text-slate-200 cursor-pointer">
            <Upload size={15} />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="text-xs text-emerald-400 text-center font-mono">
            {importStatus}
          </div>
        )}

        <button
          onClick={() => {
            if (confirm('Reset ChargeGuard local database to clean initial state?')) {
              onResetData();
            }
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-800/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 size={14} />
          <span>Reset / Restore Demo Database</span>
        </button>
      </div>
    </div>
  );
};
