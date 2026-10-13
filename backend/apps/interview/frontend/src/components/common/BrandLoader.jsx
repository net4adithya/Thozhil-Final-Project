import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ShieldCheck, Loader2 } from 'lucide-react';

/**
 * Premium Interview Preparation & Loading Experience
 * Replaces generic spinners with an intentional, calm verification sequence.
 */
export const BrandLoader = ({ 
  message = 'Preparing your assessment workspace', 
  subMessage = 'Verifying environment integrity and hardware channels',
  subtext = '',
  fullScreen = true 
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { label: 'Checking device & environment', desc: 'Hardware channels verified' },
    { label: 'Loading assessment track', desc: 'Secure evaluation profile synced' },
    { label: 'Calibrating evaluation rubrics', desc: 'Competency benchmarks loaded' },
    { label: 'Finalizing proctored workspace', desc: 'Connecting to live gateway' }
  ];

  useEffect(() => {
    if (!fullScreen) return;
    const timer1 = setTimeout(() => setStepIndex(1), 400);
    const timer2 = setTimeout(() => setStepIndex(2), 900);
    const timer3 = setTimeout(() => setStepIndex(3), 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [fullScreen]);

  const displaySubtext = subMessage || subtext;

  if (!fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="flex items-center space-x-2.5 text-blue-600 mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-xs font-semibold text-slate-900">{message}</span>
        </div>
        {displaySubtext && (
          <p className="text-[11px] text-slate-500 max-w-xs">{displaySubtext}</p>
        )}
      </div>
    );
  }

  const progressPercentage = Math.min(100, Math.round(((stepIndex + 1) / steps.length) * 100));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 font-sans select-none text-left">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-xs p-7 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-bold tracking-tight text-slate-900">THOZHIL</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Secure Initialization</span>
          </div>
        </div>

        {/* Title & Subtext */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {message}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {displaySubtext}
          </p>
        </div>

        {/* Thin Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>CALIBRATION</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>

        {/* Checklist Steps */}
        <div className="space-y-2.5 pt-1">
          {steps.map((step, idx) => {
            const isCompleted = idx < stepIndex;
            const isCurrent = idx === stepIndex;
            const isPending = idx > stepIndex;

            return (
              <div 
                key={idx}
                className={`flex items-start justify-between p-2.5 rounded-lg border transition-all duration-200 ${
                  isCurrent 
                    ? 'bg-blue-50/50 border-blue-200/80 text-blue-950'
                    : isCompleted
                    ? 'bg-slate-50/60 border-slate-200/60 text-slate-700'
                    : 'bg-transparent border-transparent text-slate-400'
                }`}
              >
                <div className="space-y-0.5">
                  <span className={`text-xs font-semibold block ${isPending ? 'text-slate-400' : 'text-slate-900'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {step.desc}
                  </span>
                </div>

                <div className="mt-0.5 shrink-0">
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  )}
                  {isPending && (
                    <Circle className="w-4 h-4 text-slate-300 stroke-[1.5]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reassurance Footer */}
        <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
          Please remain on this screen while your assessment workspace connects.
        </p>

      </div>
    </div>
  );
};

export default BrandLoader;
