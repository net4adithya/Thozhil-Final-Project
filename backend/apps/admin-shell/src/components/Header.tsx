import React from 'react';
import { Shield, RefreshCw, Layers } from './Icons';

interface HeaderProps {
  currentModule: string;
}

export const Header: React.FC<HeaderProps> = ({ currentModule }) => {
  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Layers className="w-5 h-5 text-indigo-400" />
        <h2 className="text-sm font-semibold text-slate-200">
          {currentModule}
        </h2>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Admin Shell Orchestration Mode
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title="Refresh Shell State"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800"></div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">
            System Administrator
          </span>
        </div>
      </div>
    </header>
  );
};
