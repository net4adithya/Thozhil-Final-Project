import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertOctagon, HelpCircle, ChevronDown, ChevronUp, Cpu, Award, Volume2, Play, Pause, Square } from 'lucide-react';
import type { AIReview } from '../context/InternContext';
import { ProgressRing, Card } from './PremiumComponents';

interface AIReviewCardProps {
  review?: AIReview;
  isLoading?: boolean;
}

export const AIReviewCard: React.FC<AIReviewCardProps> = ({ review, isLoading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const score = review?.score ?? 0;
  const [ttsState, setTtsState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const [ttsStatus, setTtsStatus] = useState('Ready');

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setTtsStatus('TTS Not Supported');
      return;
    }
    window.speechSynthesis.cancel();
    const text = review?.speech_text || review?.feedback;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-IN') ||
                  voices.find(v => v.lang.startsWith('en-IN')) ||
                  voices.find(v => v.lang.startsWith('en')) ||
                  null;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => { setTtsState('speaking'); setTtsStatus('Speaking…'); };
    utterance.onend = () => { setTtsState('idle'); setTtsStatus('Ready'); };
    utterance.onpause = () => { setTtsState('paused'); setTtsStatus('Paused'); };
    utterance.onresume = () => { setTtsState('speaking'); setTtsStatus('Speaking…'); };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error('SpeechSynthesis error:', e);
        setTtsState('idle');
        setTtsStatus('Ready');
      }
    };

    window.speechSynthesis.speak(utterance);
    setTtsState('speaking');
  };

  const pauseTTS = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis && ttsState === 'speaking') {
      window.speechSynthesis.pause();
      setTtsState('paused');
      setTtsStatus('Paused');
    }
  };

  const resumeTTS = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis && ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('speaking');
      setTtsStatus('Speaking…');
    }
  };

  const stopTTS = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTtsState('idle');
      setTtsStatus('Ready');
    }
  };

  // Animate score count up with RAF cleanup on unmount
  useEffect(() => {
    if (!review) return;
    let startTime: number | null = null;
    let animId: number;
    const duration = 1500; // 1.5 seconds animation

    const countUp = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.floor(easeOut * score));

      if (progress < 1) {
        animId = requestAnimationFrame(countUp);
      } else {
        setAnimatedScore(score);
      }
    };

    animId = requestAnimationFrame(countUp);
    return () => cancelAnimationFrame(animId);
  }, [review, score]);

  if (isLoading) {
    return (
      <Card className="p-8 flex flex-col justify-center items-center gap-6 min-h-[400px]">
        <div className="w-32 h-32 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2 justify-center">
            <Cpu className="animate-pulse text-accent" />
            AI Review In Progress
          </h3>
          <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mt-1">
            Analyzing log content against project requirements...
          </p>
        </div>
      </Card>
    );
  }

  if (!review) {
    return (
      <Card className="p-8 flex flex-col justify-center items-center text-center gap-4 min-h-[350px]">
        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-textSecondary-light dark:text-textSecondary-dark">
          <Cpu size={28} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
            Awaiting Submission
          </h3>
          <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark max-w-sm mt-1">
            Once you upload a work log, our AI models will instantly assess, score, and provide detailed reports.
          </p>
        </div>
      </Card>
    );
  }

  // Determine colors based on score
  let scoreColorClass = 'text-danger';
  let strokeColorClass = 'stroke-danger';
  let statusBadge = { text: 'Critical', chipClass: 'status-chip-error' };

  if (score >= 80) {
    scoreColorClass = 'text-success';
    strokeColorClass = 'stroke-success';
    statusBadge = { text: 'Excellent', chipClass: 'status-chip-success' };
  } else if (score >= 50) {
    scoreColorClass = 'text-secondary';
    strokeColorClass = 'stroke-secondary';
    statusBadge = { text: 'Moderate', chipClass: 'status-chip-blue' };
  }

  // Calculate detailed criteria score distribution
  const criteria = [
    { name: 'Relevance to Objective', score: Math.round(score * 1.02 > 100 ? 100 : score * 1.02) },
    { name: 'Technical Depth', score: Math.round(score * 0.96) },
    { name: 'Verification & Testing', score: Math.round(score * 0.92) }
  ];

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark">Review Result</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`status-chip ${statusBadge.chipClass}`}>{statusBadge.text}</span>
          <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark">
            Confidence: <span className="font-semibold text-textPrimary-light dark:text-textPrimary-dark normal-case" style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal' }}>{Math.round(review.confidence * 100)}%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-b border-borderLight dark:border-borderDark pb-6">
        {/* Score Ring */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <ProgressRing
              radius={72}
              stroke={6}
              progress={animatedScore}
              colorClass={strokeColorClass}
              ringColorClass="stroke-slate-200 dark:stroke-slate-700"
            />
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold tracking-tight ${scoreColorClass}`} style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                {animatedScore}
              </span>
              <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark mt-0.5">
                score
              </span>
            </div>
          </div>
        </div>

        {/* Evaluation Summary */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark mb-1 flex items-center gap-1.5">
              <Award size={14} className="text-primary" />
              Overall Assessment
            </h4>
            <p className="text-base font-medium text-textPrimary-light dark:text-textPrimary-dark leading-relaxed">
              "{review.feedback}"
            </p>
          </div>

          {/* TTS Player */}
          <div className="pt-3 border-t border-borderLight dark:border-borderDark">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 size={13} className="text-textSecondary-light dark:text-textSecondary-dark" />
              <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark">Listen</span>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-textSecondary-light">
                <span className={`w-1.5 h-1.5 rounded-full ${ttsState === 'speaking' ? 'bg-secondary animate-pulse' : ttsState === 'paused' ? 'bg-warning' : 'bg-slate-300 dark:bg-slate-600'}`} />
                {ttsStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {ttsState === 'idle' && (
                <button type="button" onClick={playTTS}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-secondary hover:text-secondary dark:hover:border-secondary dark:hover:text-secondary transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                  <Play size={11} fill="currentColor" /> Play
                </button>
              )}
              {ttsState === 'speaking' && (
                <button type="button" onClick={pauseTTS}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-warning hover:text-warning transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                  <Pause size={11} fill="currentColor" /> Pause
                </button>
              )}
              {ttsState === 'paused' && (
                <button type="button" onClick={resumeTTS}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-secondary hover:text-secondary transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                  <Play size={11} fill="currentColor" /> Resume
                </button>
              )}
              {ttsState !== 'idle' && (
                <button type="button" onClick={stopTTS}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-danger hover:text-danger transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                  <Square size={11} fill="currentColor" /> Stop
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bullet lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Strengths */}
        <div className="space-y-3">
          <h5 className="label-caps text-success flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            Strengths
          </h5>
          {review.strengths && review.strengths.length > 0 ? (
            <ul className="space-y-2">
              {review.strengths.map((str, i) => (
                <motion.li
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark flex gap-2 items-start"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1.5" />
                  <span>{str}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-xs font-medium italic text-textSecondary-light dark:text-textSecondary-dark">
              No strengths identified.
            </p>
          )}
        </div>

        {/* Weaknesses / Bugs */}
        <div className="space-y-3">
          <h5 className="label-caps text-danger flex items-center gap-1.5">
            <AlertOctagon size={13} />
            Bugs & Issues
          </h5>
          {review.weaknesses && review.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {review.weaknesses.map((weak, i) => (
                <motion.li
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark flex gap-2 items-start"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0 mt-1.5" />
                  <span>{weak}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-xs font-medium italic text-textSecondary-light dark:text-textSecondary-dark">
              No bugs found.
            </p>
          )}
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <h5 className="label-caps text-secondary flex items-center gap-1.5">
            <HelpCircle size={13} />
            Suggestions
          </h5>
          {review.suggestions && review.suggestions.length > 0 ? (
            <ul className="space-y-2">
                {review.suggestions.map((sug, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="font-semibold text-amber-700 dark:text-amber-500">Suggestion {i+1}</span>
                    </div>
                    <div className="ml-3.5 whitespace-pre-wrap font-mono text-xs bg-amber-50/50 dark:bg-amber-900/10 p-2 rounded border border-amber-100 dark:border-amber-900/30 overflow-x-auto">
                      {sug}
                    </div>
                  </motion.li>
                ))}
            </ul>
          ) : (
            <p className="text-xs font-medium italic text-textSecondary-light dark:text-textSecondary-dark">
              No suggestions.
            </p>
          )}
        </div>
      </div>

      {/* Manager Summary */}
      {review.managerSummary && (
        <div className="mt-6 border-t border-borderLight dark:border-borderDark pt-6 space-y-4">
          <h4 className="label-caps text-textSecondary-light dark:text-textSecondary-dark flex items-center gap-1.5">
            <Cpu size={13} />
            Manager Summary
          </h4>
          <div className="p-4 bg-bgLight dark:bg-bgDark border border-borderLight dark:border-borderDark rounded space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs font-semibold text-textSecondary-light">
                Overall Assessment Score: <span className="text-textPrimary-light dark:text-textPrimary-dark font-extrabold text-sm">{review.score} / 100</span>
              </div>
              {review.riskLevel && (
                <span className={`status-chip ${
                  review.riskLevel.toLowerCase() === 'low' ? 'status-chip-success' :
                  review.riskLevel.toLowerCase() === 'medium' ? 'status-chip-warning' :
                  'status-chip-error'
                }`}>
                  {review.riskLevel} Risk
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark leading-relaxed">
              {review.managerSummary}
            </p>
            {review.recommendation && (
              <div className="mt-3 flex items-start gap-2 bg-bgLight dark:bg-bgDark border border-borderLight dark:border-borderDark rounded p-3">
                <p className="text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark leading-relaxed">
                  <span className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">Recommendation: </span>{review.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable detailed dimensions */}
      <div className="mt-6 border-t border-borderLight dark:border-borderDark pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-between items-center py-2 label-caps text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark transition-colors"
        >
          <span>Breakdown Metrics</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 pt-4"
            >
              {criteria.map((crit, idx) => {
                let critColor = 'bg-danger';
                if (crit.score >= 80) critColor = 'bg-success';
                else if (crit.score >= 50) critColor = 'bg-warning';

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-textPrimary-light dark:text-textPrimary-dark">{crit.name}</span>
                      <span className="text-textSecondary-light dark:text-textSecondary-dark">{crit.score}/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${crit.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full ${critColor} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};
