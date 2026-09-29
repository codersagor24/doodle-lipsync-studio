import React from 'react';
import { Sparkles, Video, Download, HelpCircle, Film } from 'lucide-react';

export function Header({ onOpenExport, isAudioLoaded }) {
  return (
    <header className="bg-studio-surface border-b border-studio-border px-6 py-3.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-2xl">
          🥒
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-wide">
              Doodle Lip-Sync Studio
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              v1.0 Pro
            </span>
          </div>
          <p className="text-xs text-slate-400">
            এডুকেশনাল ও কার্টুন ডুডল লিপ-সিঙ্ক • গ্রিন স্ক্রিন ও আলফা এক্সপোর্ট
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-slate-300">
          <Film className="w-3.5 h-3.5 text-emerald-400" />
          <span>CapCut & Premiere Pro প্রস্তুত</span>
        </div>

        <button
          onClick={onOpenExport}
          disabled={!isAudioLoaded}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-lg ${
            isAudioLoaded
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>ভিডিও এক্সপোর্ট</span>
        </button>
      </div>
    </header>
  );
}
