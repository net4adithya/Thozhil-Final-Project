import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Send,
  FileText,
  Mic,
  MicOff,
  Trophy,
  Lightbulb,
  Sparkles,
  ExternalLink,
  Clock,
  ChevronRight,
  CheckCircle,
  Upload,
  X,
  File as FileIcon,
  Code2,
  AlertCircle,
  Star,
  Paperclip,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { WorkLog } from '../context/AppContext';
import { Card, Button, Textarea } from '../components/ui/PremiumComponents';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { AIReportModal } from '../components/dashboard/AIReportModal';

const TIPS = [
  '💡 The AI reviews your actual uploaded code files against the task requirements — be sure to upload them.',
  '💡 Upload all files you worked on: .js, .ts, .py, .html, etc. The AI evaluates them as a complete system.',
  '💡 Mention specific endpoints, DB schema changes, and test results in your summary for a higher score.',
  '💡 The AI checks for correctness, security, missing features, and code quality — not just word count.',
];

const ALLOWED_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'html', 'css', 'json',
  'sql', 'md', 'txt', 'sh', 'yaml', 'yml', 'toml', 'env', 'log',
];

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const colorMap: Record<string, string> = {
    js: 'text-yellow-500', jsx: 'text-yellow-400',
    ts: 'text-blue-500', tsx: 'text-blue-400',
    py: 'text-green-500',
    java: 'text-orange-500',
    html: 'text-orange-400', css: 'text-sky-400',
    json: 'text-amber-400',
    sql: 'text-purple-500',
    md: 'text-slate-500',
    default: 'text-slate-400',
  };
  return colorMap[ext] || colorMap.default;
};

export const InternDashboard: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    workLogs,
    workDescriptions,
    submitWorkLog,
    isLoading,
    addToast,
  } = useApp();

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const [logContent, setLogContent] = useState('');
  const [activeTipIdx, setActiveTipIdx] = useState(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // File upload state – multiple code files
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission result + modal
  const [submittedLog, setSubmittedLog] = useState<WorkLog | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  const projectLogs = workLogs.filter((l) => l.projectId === selectedProjectId);
  const latestDescription = [...workDescriptions]
    .filter((d) => d.projectId === selectedProjectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => setActiveTipIdx((p) => (p + 1) % TIPS.length), 6000);
    return () => clearInterval(interval);
  }, []);

  // Restore draft on project switch
  useEffect(() => {
    const saved = localStorage.getItem(`draft_log_${selectedProjectId}`);
    setLogContent(saved || '');
    setSubmittedLog(null);
    setIsSubmitSuccess(false);
    setUploadedFiles([]);
  }, [selectedProjectId]);

  // Autosave draft
  useEffect(() => {
    setIsSavingDraft(true);
    localStorage.setItem(`draft_log_${selectedProjectId}`, logContent);
    const t = setTimeout(() => setIsSavingDraft(false), 900);
    return () => clearTimeout(t);
  }, [logContent, selectedProjectId]);

  // Validate + add files
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid = arr.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return ALLOWED_EXTENSIONS.includes(ext);
    });
    const invalid = arr.length - valid.length;
    if (invalid > 0) alert(`${invalid} file(s) skipped (unsupported type). Allowed: ${ALLOWED_EXTENSIONS.slice(0, 10).join(', ')}…`);
    setUploadedFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  }, []);

  const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  // Voice dictation using Web Speech API with graceful fallback
  const handleVoiceTyping = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Voice recognition is not supported in your browser.', 'info');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsVoiceActive(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setLogContent(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsVoiceActive(false);
      };
      recognition.onerror = () => {
        setIsVoiceActive(false);
        addToast('Voice input failed. Check microphone permissions.', 'info');
      };
      recognition.onend = () => setIsVoiceActive(false);

      recognition.start();
    } catch {
      setIsVoiceActive(false);
      addToast('Failed to start voice dictation.', 'info');
    }
  };

  // Quality indicator
  const analyzeQuality = () => {
    const words = logContent.trim().split(/\s+/).filter(Boolean).length;
    const hasFiles = uploadedFiles.length > 0;
    if (!hasFiles && words === 0) return { label: 'No files or text', color: 'text-slate-400', pct: 0, desc: 'Upload your code files and write a brief summary of what you built.' };
    if (!hasFiles) return { label: 'Files missing!', color: 'text-red-500', pct: 15, desc: 'The AI needs your code files to conduct a real review. Upload them above.' };
    if (words === 0) return { label: 'Summary missing', color: 'text-amber-500', pct: 40, desc: 'Add a brief summary of what you built and what endpoints/features you completed.' };

    let score = 60;
    if (uploadedFiles.length >= 2) score += 10;
    if (logContent.toLowerCase().includes('test')) score += 8;
    if (logContent.toLowerCase().includes('db') || logContent.toLowerCase().includes('database')) score += 7;
    if (logContent.toLowerCase().includes('api') || logContent.toLowerCase().includes('endpoint')) score += 7;
    if (words > 30) score += 5;
    score = Math.min(100, score);

    if (score >= 85) return { label: 'Strong Submission', color: 'text-emerald-500', pct: score, desc: 'Excellent! Files uploaded + detailed summary. AI will give a thorough review.' };
    if (score >= 65) return { label: 'Good Submission', color: 'text-blue-500', pct: score, desc: 'Good. Consider adding test results or endpoint names to the summary.' };
    return { label: 'Moderate', color: 'text-amber-500', pct: score, desc: 'Add more detail to your summary for a better AI evaluation.' };
  };

  const quality = analyzeQuality();

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0 && !logContent.trim()) return;

    try {
      const responseLog = await submitWorkLog(selectedProjectId, logContent, uploadedFiles);
      setSubmittedLog(responseLog);
      setIsSubmitSuccess(true);
      setLogContent('');
      setUploadedFiles([]);
      localStorage.removeItem(`draft_log_${selectedProjectId}`);
      // Auto-open AI report after brief delay
      setTimeout(() => setIsReportOpen(true), 500);
    } catch (err: any) {
      console.error('Submission failed:', err);
      addToast(err?.message || 'Failed to submit work log. Please try again.', 'error');
    }
  };

  return (
    <DashboardLayout>
      {/* AI Report Modal */}
      {submittedLog?.review && (
        <AIReportModal
          review={submittedLog.review}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          submittedAt={submittedLog.uploadedAt}
          projectName={activeProject?.name}
          internName="Sanjay Kumar"
        />
      )}

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-textPrimary-light dark:text-textPrimary-dark">
          Welcome Back, Sanjay
        </h1>
        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mt-1">
          Submitting code for{' '}
          <span className="font-bold text-textPrimary-light dark:text-textPrimary-dark">
            {activeProject.name}
          </span>
        </p>
      </div>

      {/* ── AI Tips Ticker ── */}
      <Card hoverGlow={false} className="py-3 px-5 border-l-4 border-l-accent bg-accent/5 dark:bg-accent/10 flex items-center gap-3">
        <Lightbulb className="text-accent shrink-0" size={18} />
        <div className="text-xs font-semibold text-textPrimary-light dark:text-textPrimary-dark flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.span key={activeTipIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="inline-block">
              {TIPS[activeTipIdx]}
            </motion.span>
          </AnimatePresence>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left Column ── */}
        <div className="lg:col-span-7 space-y-8">

          {/* Assigned Task Requirements */}
          <Card hoverGlow={false} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">
                  Assigned Task Requirements
                </h2>
              </div>
              {latestDescription && (
                <span className="text-[10px] font-bold text-textSecondary-light">
                  Issued: {new Date(latestDescription.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {latestDescription ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-borderLight dark:border-borderDark rounded-xl text-sm leading-relaxed space-y-2">
                {latestDescription.description.split('\n').map((line, idx) => {
                  if (line.startsWith('###')) return <h4 key={idx} className="text-sm font-extrabold mt-2 text-textPrimary-light dark:text-textPrimary-dark">{line.replace('###', '').trim()}</h4>;
                  if (line.startsWith('-') || line.startsWith('*')) return <li key={idx} className="ml-4 list-disc font-medium">{line.replace(/^[-*]\s*/, '')}</li>;
                  return <p key={idx} className="font-medium">{line}</p>;
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-textSecondary-light dark:text-textSecondary-dark italic">
                Awaiting work descriptions from your project authority.
              </div>
            )}
          </Card>

          {/* Submit Form */}
          <Card hoverGlow={false} className="p-6 relative">

            {/* Autosave */}
            <div className="absolute top-6 right-6 flex items-center gap-1.5 text-xs text-textSecondary-light font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${isSavingDraft ? 'bg-primary animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <span>{isSavingDraft ? 'Saving draft…' : 'Draft saved'}</span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <Cpu className="text-accent" size={20} />
              <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">
                Submit Code for AI Review
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── STEP 1: File Upload ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                  <span className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark">Upload Your Code Files</span>
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-2 py-0.5 rounded-full">Required for AI Review</span>
                </div>

                <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark ml-7">
                  Upload the code files you built for this task. The AI will read and evaluate them against the task requirements.
                </p>

                {/* Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`relative border-2 border-dashed rounded p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-secondary bg-secondary/5 dark:bg-secondary/10'
                      : 'border-borderLight dark:border-borderDark hover:border-secondary/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="file-upload-input"
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS.map(e => `.${e}`).join(',')}
                    onChange={e => e.target.files && addFiles(e.target.files)}
                    className="hidden"
                    aria-label="Upload code files"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${isDragOver ? 'bg-secondary/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Upload size={18} className={isDragOver ? 'text-secondary' : 'text-textSecondary-light'} />
                    </div>
                    <div className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark">
                      {isDragOver ? 'Drop files here' : 'Drag & drop your code files, or click to browse'}
                    </div>
                    <div className="text-[11px] text-textSecondary-light dark:text-textSecondary-dark">
                      .js .ts .py .java .html .css .json .sql and more · Up to 10 files
                    </div>
                  </div>

                  {/* Paperclip shortcut icon */}
                  <div className="absolute top-3 right-3">
                    <Paperclip size={14} className="text-textSecondary-light opacity-40" />
                  </div>
                </div>

                {/* File List */}
                <AnimatePresence>
                  {uploadedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="label-caps text-textSecondary-light dark:text-textSecondary-dark px-1">
                        {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} staged
                      </div>
                      {uploadedFiles.map((file, idx) => (
                        <motion.div
                          key={`${file.name}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between gap-3 px-3 py-2 bg-bgLight dark:bg-bgDark border border-borderLight dark:border-borderDark rounded"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Code2 size={15} className={getFileIcon(file.name)} />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark truncate">
                                {file.name}
                              </div>
                              <div className="text-[10px] text-textSecondary-light">
                                {(file.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-borderLight dark:border-borderDark hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-danger hover:text-danger transition-colors text-textSecondary-light"
                            aria-label={`Remove file ${file.name}`}
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── STEP 2: Summary Text ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                  <span className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark">Write a Summary <span className="font-normal text-textSecondary-light">(optional but recommended)</span></span>
                </div>

                <div className="relative ml-0">
                  <Textarea
                    label="Briefly describe what you built, endpoints added, DB changes, tests run…"
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    placeholder="e.g. Implemented /api/billing/portal endpoint. Integrated Stripe webhooks for subscription updates. Added unit tests — all 12 passing."
                    className="min-h-[160px] pr-12"
                  />

                  {/* Voice button */}
                  <button
                    type="button"
                    onClick={handleVoiceTyping}
                    className={`absolute right-4 bottom-7 p-2 rounded-full border transition-all ${
                      isVoiceActive
                        ? 'bg-danger border-danger text-white'
                        : 'bg-white dark:bg-cardDark text-textSecondary-light border-borderLight dark:border-borderDark hover:border-secondary hover:text-secondary'
                    }`}
                    title="Voice dictation"
                    aria-label={isVoiceActive ? "Stop voice dictation" : "Start voice dictation"}
                    aria-pressed={isVoiceActive}
                  >
                    {isVoiceActive ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
              </div>

              {/* Quality + Submit */}
              <div className="space-y-4 pt-1">
                {/* Quality bar */}
                <div className="space-y-2 bg-bgLight dark:bg-bgDark p-4 border border-borderLight dark:border-borderDark rounded">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-textSecondary-light flex items-center gap-1.5">
                      <Info size={12} /> Submission Readiness
                    </span>
                    <span className={`font-extrabold ${quality.color}`}>{quality.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${quality.pct}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${quality.pct >= 80 ? 'bg-emerald-500' : quality.pct >= 55 ? 'bg-blue-500' : quality.pct >= 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                    />
                  </div>
                  <p className="text-[10px] text-textSecondary-light">{quality.desc}</p>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    id="submit-log-btn"
                    isLoading={isLoading}
                    disabled={uploadedFiles.length === 0 && !logContent.trim()}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    Submit for AI Review <Send size={15} />
                  </Button>
                </div>

                {uploadedFiles.length === 0 && (
                  <p className="text-center text-[11px] text-textSecondary-light">
                    ↑ Upload at least one code file to enable real AI review
                  </p>
                )}
              </div>

            </form>
          </Card>

          {/* ── Success Banner ── */}
          <AnimatePresence>
            {isSubmitSuccess && submittedLog?.review && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900/40 p-5 shadow-sm"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/10 blur-3xl pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                        Submitted! AI Review Complete.
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        Score: {submittedLog.review.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-1 leading-relaxed line-clamp-2">
                      {submittedLog.review.feedback}
                    </p>
                  </div>
                  <button
                    id="view-ai-report-btn"
                    onClick={() => setIsReportOpen(true)}
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
                  >
                    <Sparkles size={13} />
                    View Report
                    <ExternalLink size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-5 space-y-8">

          {/* Team Members */}
          <Card hoverGlow={false} className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textSecondary-light mb-4">
              My Team ({activeProject.members.length})
            </h3>
            <div className="space-y-4">
              {activeProject.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between border-b border-borderLight dark:border-borderDark/40 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-borderLight dark:border-borderDark" />
                    <div>
                      <div className="text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark">
                        {member.name} {member.id === 'intern-sanjay' ? '(You)' : ''}
                      </div>
                      <div className="text-[10px] text-textSecondary-light dark:text-textSecondary-dark">{member.role}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-textSecondary-light bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
                    {member.email}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent AI Reviews */}
          <Card hoverGlow={false} className="p-6">
            <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark mb-5 flex items-center gap-2">
              <Trophy className="text-warning" size={20} />
              Recent AI Reviews
            </h2>

            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 custom-scroll">
              {projectLogs.filter(l => l.review).map((log) => {
                const review = log.review!;
                let ratingBadge = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40';
                let dotColor = 'bg-red-400';
                if (review.score >= 80) { ratingBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'; dotColor = 'bg-emerald-500'; }
                else if (review.score >= 50) { ratingBadge = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'; dotColor = 'bg-amber-400'; }

                const isLatest = submittedLog?.id === log.id;

                return (
                  <motion.div
                    key={log.id}
                    initial={isLatest ? { opacity: 0, y: 12 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className={`p-4 border rounded-2xl space-y-3 transition-all ${
                      isLatest
                        ? 'border-primary/30 bg-primary/3 dark:bg-primary/5 ring-1 ring-primary/20'
                        : 'border-borderLight dark:border-borderDark bg-white dark:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="text-[11px] font-bold text-textSecondary-light flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(log.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {isLatest && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Latest</span>}
                      </div>
                      <span className={`text-xs font-extrabold border rounded-full py-0.5 px-3 ${ratingBadge}`}>
                        <Star size={10} className="inline mr-1 -mt-0.5" />{review.score}/100
                      </span>
                    </div>

                    {/* Feedback excerpt */}
                    <p className="text-xs font-medium italic text-textSecondary-light dark:text-textSecondary-dark leading-relaxed line-clamp-2">
                      "{review.feedback}"
                    </p>

                    {/* Files submitted */}
                    {log.fileName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-textSecondary-light">
                        <FileIcon size={11} />
                        <span className="font-medium">{log.fileName}</span>
                      </div>
                    )}

                    {/* First strength */}
                    {review.strengths?.[0] && (
                      <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={11} className="shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{review.strengths[0]}</span>
                      </div>
                    )}

                    {/* View report CTA */}
                    <button
                      onClick={() => { setSubmittedLog(log); setIsReportOpen(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-primary hover:text-primary-hover border border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-xl transition-all"
                    >
                      <Sparkles size={11} />
                      View Full AI Report
                      <ChevronRight size={11} />
                    </button>
                  </motion.div>
                );
              })}

              {projectLogs.filter(l => l.review).length === 0 && (
                <div className="text-center py-10 text-sm text-textSecondary-light dark:text-textSecondary-dark italic">
                  No evaluations yet. Upload your code files and submit above.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};
