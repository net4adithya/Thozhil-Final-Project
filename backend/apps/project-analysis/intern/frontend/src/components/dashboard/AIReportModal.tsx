import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  AlertOctagon,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Volume2,
  Play,
  Pause,
  Square,
  TrendingUp,
  ShieldAlert,
  ClipboardList,
  Cpu,
  FileText,
  Calendar,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react';
import { ProgressRing } from '../ui/PremiumComponents';
import type { AIReview } from '../../context/AppContext';

interface AIReportModalProps {
  review: AIReview;
  isOpen: boolean;
  onClose: () => void;
  submittedAt?: string;
  projectName?: string;
  internName?: string;
}

export const AIReportModal: React.FC<AIReportModalProps> = ({
  review,
  isOpen,
  onClose,
  submittedAt,
  projectName,
  internName,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('strengths');
  const [ttsState, setTtsState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const [ttsStatus, setTtsStatus] = useState('Ready');
  const scrollRef = useRef<HTMLDivElement>(null);

  const score = review?.score ?? 0;

  // Stop TTS on close
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAnimatedScore(0);
    } else {
      document.body.style.overflow = '';
      window.speechSynthesis?.cancel();
      setTtsState('idle');
      setTtsStatus('Ready');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Animate score count-up with RAF cleanup on unmount
  useEffect(() => {
    if (!isOpen || !review) return;
    let startTime: number | null = null;
    let animId: number;
    const duration = 1800;
    const countUp = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
  }, [isOpen, score, review]);

  // TTS functions
  const playTTS = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = review?.speech_text || review?.feedback;
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { setTtsState('speaking'); setTtsStatus('Speaking…'); };
    utterance.onend = () => { setTtsState('idle'); setTtsStatus('Ready'); };
    utterance.onpause = () => { setTtsState('paused'); setTtsStatus('Paused'); };
    utterance.onresume = () => { setTtsState('speaking'); setTtsStatus('Speaking…'); };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') { setTtsState('idle'); setTtsStatus('Ready'); }
    };
    window.speechSynthesis.speak(utterance);
    setTtsState('speaking');
  };

  const pauseTTS = () => {
    if (window.speechSynthesis && ttsState === 'speaking') {
      window.speechSynthesis.pause();
      setTtsState('paused');
      setTtsStatus('Paused');
    }
  };

  const resumeTTS = () => {
    if (window.speechSynthesis && ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('speaking');
      setTtsStatus('Speaking…');
    }
  };

  const stopTTS = () => {
    window.speechSynthesis?.cancel();
    setTtsState('idle');
    setTtsStatus('Ready');
  };

  // Score color system
  let scoreColorClass = 'text-danger';
  let strokeColorClass = 'stroke-danger';
  let ringBg = 'bg-danger/8';
  let statusBadge = { text: 'Critical', bg: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40' };
  let headerGradient = 'from-red-500/10 via-transparent to-transparent';

  if (score >= 80) {
    scoreColorClass = 'text-emerald-600 dark:text-emerald-400';
    strokeColorClass = 'stroke-emerald-500';
    ringBg = 'bg-emerald-500/8';
    statusBadge = { text: 'Excellent', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40' };
    headerGradient = 'from-emerald-500/10 via-transparent to-transparent';
  } else if (score >= 50) {
    scoreColorClass = 'text-amber-600 dark:text-amber-400';
    strokeColorClass = 'stroke-amber-500';
    ringBg = 'bg-amber-500/8';
    statusBadge = { text: 'Moderate', bg: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40' };
    headerGradient = 'from-amber-500/10 via-transparent to-transparent';
  }

  const criteria = [
    { name: 'Relevance to Objective', score: Math.min(100, Math.round(score * 1.02)), color: 'bg-blue-500' },
    { name: 'Technical Depth', score: Math.round(score * 0.96), color: 'bg-violet-500' },
    { name: 'Verification & Testing', score: Math.round(score * 0.92), color: 'bg-teal-500' },
    { name: 'Code Quality & Structure', score: Math.min(100, Math.round(score * 0.98)), color: 'bg-indigo-500' },
  ];

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

  if (!review) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50"
            onClick={onClose}
            style={{ position: 'fixed', inset: 0 }}
          />

          {/* Modal Panel – rendered via portal so sidebar z-index can't clip it */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            style={{ position: 'fixed', inset: 0 }}
          >
            <div
              className="pointer-events-auto w-full max-w-4xl max-h-[92vh] bg-white dark:bg-cardDark rounded border border-borderLight dark:border-borderDark shadow-modal dark:shadow-modal-dark flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >

              {/* ── Modal Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-borderLight dark:border-borderDark">
                {/* Decorative blur removed */}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                      AI Evaluation Report
                    </h2>
                    <p className="text-[11px] text-textSecondary-light dark:text-textSecondary-dark">
                      Automated log review
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Meta info */}
                  {(submittedAt || projectName) && (
                    <div className="hidden sm:flex flex-col items-end gap-0.5">
                      {internName && <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark normal-case" style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.6875rem' }}>{internName}</span>}
                      {projectName && <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark normal-case" style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.6875rem' }}>{projectName}</span>}
                      {submittedAt && <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark normal-case" style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.6875rem' }}>{new Date(submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  )}
                  <button
                    id="ai-report-close-btn"
                    onClick={onClose}
                    className="w-8 h-8 rounded border border-borderLight dark:border-borderDark hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-textSecondary-light dark:text-textSecondary-dark transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* ── Scrollable Content ── */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto modal-scroll">

                {/* ── Hero Score Section ── */}
                <div className="px-6 py-6 border-b border-borderLight dark:border-borderDark">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">

                    {/* Score Ring */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-3">
                      <div className="relative">
                        <ProgressRing
                          radius={72}
                          stroke={7}
                          progress={animatedScore}
                          colorClass={strokeColorClass}
                          ringColorClass="stroke-slate-200 dark:stroke-slate-700"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-4xl font-bold tracking-tight ${scoreColorClass}`} style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
                            {animatedScore}
                          </span>
                          <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark">
                            / 100
                          </span>
                        </div>
                      </div>
                      <span className={`status-chip ${
                        score >= 80 ? 'status-chip-success' :
                        score >= 50 ? 'status-chip-warning' :
                        'status-chip-error'
                      }`}>{statusBadge.text}</span>
                      <div className="label-caps text-textSecondary-light dark:text-textSecondary-dark normal-case" style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.6875rem' }}>
                        Confidence: <span className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{Math.round((review.confidence ?? 0.9) * 100)}%</span>
                      </div>
                    </div>

                    {/* Assessment Text + TTS */}
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Award size={14} className="text-primary" />
                          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Overall Assessment
                          </h3>
                        </div>
                        <p className="text-base font-medium text-textPrimary-light dark:text-textPrimary-dark leading-relaxed border-l-4 border-borderLight dark:border-borderDark pl-4">
                          "{review.feedback}"
                        </p>
                      </div>

                      {/* TTS Player */}
                      <div className="p-3 rounded border border-borderLight dark:border-borderDark bg-bgLight dark:bg-bgDark">
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 size={13} className="text-textSecondary-light dark:text-textSecondary-dark" />
                          <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark">Listen</span>
                          <span className={`ml-auto flex items-center gap-1.5 label-caps text-textSecondary-light dark:text-textSecondary-dark normal-case`} style={{ fontFamily: 'Inter, sans-serif', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.6875rem' }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ttsState === 'speaking' ? 'bg-secondary animate-pulse' : ttsState === 'paused' ? 'bg-warning' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            {ttsStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {ttsState === 'idle' && (
                            <button onClick={playTTS} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-secondary hover:text-secondary transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                              <Play size={11} fill="currentColor" /> Play
                            </button>
                          )}
                          {ttsState === 'speaking' && (
                            <button onClick={pauseTTS} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-warning hover:text-warning transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                              <Pause size={11} fill="currentColor" /> Pause
                            </button>
                          )}
                          {ttsState === 'paused' && (
                            <button onClick={resumeTTS} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-secondary hover:text-secondary transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                              <Play size={11} fill="currentColor" /> Resume
                            </button>
                          )}
                          {ttsState !== 'idle' && (
                            <button onClick={stopTTS} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-borderLight dark:border-borderDark rounded hover:border-danger hover:text-danger transition-colors text-textSecondary-light dark:text-textSecondary-dark">
                              <Square size={11} fill="currentColor" /> Stop
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Breakdown bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {criteria.map((crit, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span className="text-slate-600 dark:text-slate-300">{crit.name}</span>
                              <span className="text-slate-400 dark:text-slate-500">{crit.score}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${crit.score}%` }}
                                transition={{ duration: 1.2, delay: idx * 0.15, ease: 'easeOut' }}
                                className={`h-full ${crit.color} rounded-full`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Expandable Sections ── */}
                <div className="divide-y divide-borderLight dark:divide-borderDark">

                  {/* Strengths */}
                  <SectionAccordion
                    id="strengths"
                    title="Strengths"
                    icon={<CheckCircle2 size={15} className="text-emerald-500" />}
                    badgeColor="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40"
                    count={review.strengths?.length ?? 0}
                    isExpanded={expandedSection === 'strengths'}
                    onToggle={() => toggleSection('strengths')}
                  >
                    <ul className="space-y-2.5">
                      {review.strengths?.map((str, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {str}
                        </motion.li>
                      ))}
                    </ul>
                  </SectionAccordion>

                  {/* Weaknesses / Bugs */}
                  <SectionAccordion
                    id="weaknesses"
                    title="Bugs & Issues"
                    icon={<AlertOctagon size={15} className="text-red-500" />}
                    badgeColor="bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40"
                    count={review.weaknesses?.length ?? 0}
                    isExpanded={expandedSection === 'weaknesses'}
                    onToggle={() => toggleSection('weaknesses')}
                  >
                    {review.weaknesses && review.weaknesses.length > 0 ? (
                      <ul className="space-y-2.5">
                        {review.weaknesses.map((weak, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {weak}
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm font-medium italic text-slate-400 dark:text-slate-500">
                        No bugs found.
                      </p>
                    )}
                  </SectionAccordion>

                  {/* Suggestions */}
                  <SectionAccordion
                    id="suggestions"
                    title="Actionable Suggestions"
                    icon={<Lightbulb size={15} className="text-amber-500" />}
                    badgeColor="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40"
                    count={review.suggestions?.length ?? 0}
                    isExpanded={expandedSection === 'suggestions'}
                    onToggle={() => toggleSection('suggestions')}
                  >
                    {review.suggestions && review.suggestions.length > 0 ? (
                      <ul className="space-y-2.5">
                        {review.suggestions.map((sug, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <div className="whitespace-pre-wrap font-mono text-xs p-1 bg-amber-50/50 dark:bg-amber-900/10 rounded-md overflow-x-auto w-full">
                              {sug}
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm font-medium italic text-slate-400 dark:text-slate-500">
                        No suggestions.
                      </p>
                    )}
                  </SectionAccordion>

                  {/* Missing Items */}
                  <SectionAccordion
                    id="missing"
                    title="Missing Requirements"
                    icon={<AlertTriangle size={15} className="text-orange-500" />}
                    badgeColor="bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/40"
                    count={review.missing?.length ?? 0}
                    isExpanded={expandedSection === 'missing'}
                    onToggle={() => toggleSection('missing')}
                  >
                    {review.missing && review.missing.length > 0 ? (
                      <ul className="space-y-2.5">
                        {review.missing.map((m, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            {m}
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm font-medium italic text-slate-400 dark:text-slate-500">
                        Nothing missing.
                      </p>
                    )}
                  </SectionAccordion>
                </div>

                {/* ── Manager Summary ── */}
                {review.managerSummary && (
                  <div className="px-6 py-6 border-t border-borderLight dark:border-borderDark space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList size={14} className="text-textSecondary-light dark:text-textSecondary-dark" />
                      <span className="label-caps text-textSecondary-light dark:text-textSecondary-dark">Manager Summary</span>
                    </div>

                    <div className="p-4 rounded border border-borderLight dark:border-borderDark bg-bgLight dark:bg-bgDark space-y-4">
                      {/* Score + Risk */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp size={14} className="text-primary" />
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Score:</span>
                          <span className={`font-extrabold text-base ${scoreColorClass}`}>{review.score} / 100</span>
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

                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        {review.managerSummary}
                      </p>

                      {review.recommendation && (
                        <div className="flex items-start gap-3 bg-bgLight dark:bg-bgDark border border-borderLight dark:border-borderDark rounded p-3">
                          <div>
                            <div className="label-caps text-textSecondary-light dark:text-textSecondary-dark mb-1">Recommendation</div>
                            <p className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark leading-relaxed">
                              {review.recommendation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="px-6 py-3 border-t border-borderLight dark:border-borderDark bg-bgLight dark:bg-bgDark flex items-center justify-between">
                <div className="label-caps text-textSecondary-light dark:text-textSecondary-dark">
                  Automated review
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded hover:bg-primary-hover transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ── Section Accordion Helper ──
interface SectionAccordionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  badgeColor: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  icon,
  badgeColor,
  count,
  isExpanded,
  onToggle,
  children,
}) => (
  <div>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-bgLight dark:hover:bg-bgDark transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark">{title}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {count}
        </span>
      </div>
      <div className="text-textSecondary-light dark:text-textSecondary-dark">
        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </div>
    </button>

    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-5">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
