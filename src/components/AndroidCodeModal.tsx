import React, { useState } from 'react';
import { 
  X, 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Folder, 
  File, 
  Terminal,
  Layers
} from 'lucide-react';
import { ANDROID_SOURCE_FILES, AndroidSourceFile } from '../data/androidSourceCode';

interface AndroidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeModal: React.FC<AndroidCodeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<AndroidSourceFile>(ANDROID_SOURCE_FILES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadAll = () => {
    const allCode = ANDROID_SOURCE_FILES.map(f => `// ==========================================\n// FILE: ${f.path}\n// ==========================================\n\n${f.code}`).join('\n\n\n');
    const blob = new Blob([allCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ChargeGuard_Android_Kotlin_Source.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileCode2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Native Android Kotlin Source Tree</h3>
              <p className="text-[11px] text-slate-400">Jetpack Compose • Room SQLite • AlarmManager • BootReceiver</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download All Source</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body (Sidebar + Code View) */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-slate-800 bg-slate-950/50 p-2 overflow-y-auto max-h-48 sm:max-h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 mb-1">
              Project Files
            </div>
            <div className="space-y-0.5">
              {ANDROID_SOURCE_FILES.map((file) => {
                const isSelected = selectedFile.name === file.name;
                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <File size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                    <span className="truncate">{file.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* File Path & Description Bar */}
            <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-indigo-400 text-[11px]">{selectedFile.path}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Text Content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-950 selection:bg-indigo-500/30">
              <pre className="whitespace-pre">{selectedFile.code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
