import React, { useState, useEffect } from 'react';
import { Server, AlertCircle, RefreshCw, Cpu, Layers } from './Icons';

interface ModuleFrameProps {
  moduleName: string;
  originalProject: string;
  targetPort: number;
  targetUrl: string;
  techStack: string;
  description: string;
}

export const ModuleFrame: React.FC<ModuleFrameProps> = ({
  moduleName,
  originalProject,
  targetPort,
  targetUrl,
  techStack,
  description,
}) => {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isMounting, setIsMounting] = useState<boolean>(true);

  // Ping backend / dev server health
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const response = await fetch(targetUrl, { mode: 'no-cors' });
        if (isMounted) {
          setIsLive(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsLive(false);
        }
      } finally {
        if (isMounted) setIsMounting(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [targetUrl]);

  const reloadModule = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Module Navigation & Mounting Control Bar */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20"></span>
            <span className="font-semibold text-sm text-slate-100">{moduleName}</span>
          </div>
          
          <span className="text-slate-600">|</span>
          
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span>Target: <strong className="text-slate-200">http://localhost:{targetPort}</strong></span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>{techStack}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Health Status Indicator */}
          {isLive === true && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Service Detected
            </span>
          )}
          {isLive === false && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              Dev Server Offline (Port {targetPort})
            </span>
          )}

          <button
            onClick={reloadModule}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1.5 px-2.5"
            title="Reload Module Frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Frame</span>
          </button>
        </div>
      </div>

      {/* Embedded Single-Tab App Mounting Canvas */}
      <div className="flex-1 relative bg-slate-950">
        <iframe
          key={iframeKey}
          src={targetUrl}
          title={moduleName}
          className="w-full h-full border-0 bg-slate-900"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />

        {/* Offline / Placeholder Overlay when dev server is not active */}
        {isLive === false && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <Layers className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              {moduleName} — Target Application Shell
            </h3>
            
            <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
              {description}
            </p>

            <div className="glass-panel p-4 rounded-xl max-w-md w-full text-left font-mono text-xs text-slate-300 space-y-2 mb-6 border border-slate-800">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Original Project:</span>
                <span className="text-indigo-300">{originalProject}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Target Port:</span>
                <span className="text-indigo-300">{targetPort}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mount URL:</span>
                <span className="text-indigo-300">{targetUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={reloadModule}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Mount Connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
