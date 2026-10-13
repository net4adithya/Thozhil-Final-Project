import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Sparkles, User, Loader2 } from 'lucide-react';

/**
 * Lead AI Interviewer Visual Presence (Ava)
 * Professional, calm remote evaluator interface.
 * Features subtle acoustic level activity and clear human turn-taking states.
 */
export const AiInterviewerAvatar = ({
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  currentPhrase = '',
  phraseType = 'question',
  className = ''
}) => {
  const [frequencies, setFrequencies] = useState(() => Array(20).fill(6));
  const animationFrameRef = useRef(null);

  // Smooth acoustic frequency modulation for active voice turns
  useEffect(() => {
    let lastTime = performance.now();

    const animateAudio = (time) => {
      const delta = time - lastTime;
      if (delta > 45) {
        lastTime = time;

        if (isSpeaking) {
          const newFreqs = Array.from({ length: 20 }, (_, i) => {
            const centerDistance = Math.abs(i - 9.5) / 10;
            const envelope = 1 - centerDistance * 0.5;
            const wave = Math.sin(time * 0.008 + i * 0.5);
            const combined = Math.max(0.15, (wave * 0.4 + 0.6) * envelope);
            return Math.round(combined * 36) + 4;
          });
          setFrequencies(newFreqs);
        } else if (isListening) {
          const newFreqs = Array.from({ length: 20 }, (_, i) => {
            const wave = Math.sin(time * 0.003 + i * 0.3);
            return Math.round(Math.max(4, 6 + wave * 4));
          });
          setFrequencies(newFreqs);
        } else if (isThinking) {
          const sweepPos = ((time * 0.002) % 1) * 20;
          const newFreqs = Array.from({ length: 20 }, (_, i) => {
            const dist = Math.abs(i - sweepPos);
            const height = dist < 3 ? 18 - dist * 4 : 4;
            return Math.max(4, Math.round(height));
          });
          setFrequencies(newFreqs);
        } else {
          setFrequencies(Array(20).fill(4));
        }
      }

      animationFrameRef.current = requestAnimationFrame(animateAudio);
    };

    animationFrameRef.current = requestAnimationFrame(animateAudio);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isSpeaking, isListening, isThinking]);

  return (
    <div className={`relative flex flex-col items-center justify-between select-none overflow-hidden rounded-xl bg-slate-900 p-6 border border-slate-800 shadow-xs ${className}`}>
      
      {/* Top Presence Bar */}
      <div className="w-full flex items-center justify-between z-10 text-xs pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-[11px]">
            IX
          </div>
          <span className="font-semibold text-slate-200">Ava</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 text-[11px]">Lead AI Evaluator</span>
        </div>

        {/* Human Turn-Taking Badge */}
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${
            isSpeaking ? 'bg-blue-400 animate-pulse' :
            isListening ? 'bg-emerald-400 animate-pulse' :
            isThinking ? 'bg-amber-400' :
            'bg-slate-500'
          }`} />
          <span className="font-medium text-slate-300 text-xs">
            {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isThinking ? 'Preparing next question…' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Central Evaluator Visual Presence */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8 w-full space-y-5">
        
        {/* Clean Avatar Circle */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Ring Indicator */}
          <div 
            className={`w-24 h-24 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
              isSpeaking
                ? 'border-blue-500/60 shadow-lg shadow-blue-500/10'
                : isListening
                ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                : isThinking
                ? 'border-amber-500/60'
                : 'border-slate-700'
            } bg-slate-800`}
          >
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-200">
              {isThinking ? (
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 text-blue-400" />
              ) : isListening ? (
                <Mic className="w-8 h-8 text-emerald-400" />
              ) : (
                <span className="font-bold text-lg text-slate-300 tracking-tight">AVA</span>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Acoustic Waveform Frequency Bars */}
        <div className="flex items-center justify-center space-x-1 h-10 px-4">
          {frequencies.map((h, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-75 ${
                isSpeaking
                  ? 'bg-blue-500/90'
                  : isListening
                  ? 'bg-emerald-500/80'
                  : isThinking
                  ? 'bg-amber-400/80'
                  : 'bg-slate-700/60'
              }`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

      </div>

      {/* Bottom Status Prompt Caption */}
      <div className="w-full z-10 pt-3 border-t border-slate-800/80 text-center">
        <span className="text-[11px] text-slate-400">
          {isSpeaking 
            ? 'Listen carefully to the technical scenario…' 
            : isListening 
            ? 'Speak clearly into your microphone when formulating your answer' 
            : isThinking 
            ? 'Analyzing substantive technical concepts…' 
            : 'Turn-taking calibrated for natural conversation'}
        </span>
      </div>

    </div>
  );
};

export default AiInterviewerAvatar;
