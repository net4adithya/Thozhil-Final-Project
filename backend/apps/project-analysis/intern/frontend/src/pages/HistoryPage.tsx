import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpDown, Clock, FileText, Calendar, Sparkles, ChevronRight, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { WorkLog } from '../context/AppContext';
import { Card, Button, Input } from '../components/ui/PremiumComponents';
import { AIReviewCard } from '../components/dashboard/AIReviewCard';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';

type ScoreFilter = 'all' | 'excellent' | 'moderate' | 'critical';
type SortKey = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc';

export const HistoryPage: React.FC = () => {
  const { workLogs, projects } = useApp();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);

  // Filter and sort computation
  const filteredLogs = workLogs
    .filter((log) => {
      // 1. Search filter
      const project = projects.find((p) => p.id === log.projectId);
      const searchStr = `${log.content} ${project?.name || ''} ${project?.code || ''} ${log.review?.feedback || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Score filter
      if (!log.review) return scoreFilter === 'all';
      const score = log.review.score;
      if (scoreFilter === 'excellent') return score >= 80;
      if (scoreFilter === 'moderate') return score >= 50 && score < 80;
      if (scoreFilter === 'critical') return score < 50;

      return true;
    })
    .sort((a, b) => {
      // 3. Sorting
      if (sortKey === 'date-desc') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sortKey === 'date-asc') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      
      const scoreA = a.review?.score ?? -1;
      const scoreB = b.review?.score ?? -1;
      if (sortKey === 'score-desc') return scoreB - scoreA;
      if (sortKey === 'score-asc') return scoreA - scoreB;

      return 0;
    });

  return (
    <DashboardLayout>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-textPrimary-light dark:text-textPrimary-dark">
          Evaluation History Log
        </h1>
        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
          Review details, scores, and feedback for all previous cohort submissions.
        </p>
      </div>

      {/* Filter and Control Bar */}
      <Card hoverGlow={false} className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content, feedback, projects..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-bgLight dark:bg-bgDark border border-borderLight dark:border-borderDark rounded focus:outline-none transition-all font-medium text-textPrimary-light dark:text-textPrimary-dark"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary-light" size={15} />
          </div>

          {/* Score rating pills */}
          <div className="lg:col-span-5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-bold text-textSecondary-light mr-2 select-none">Rating:</span>
            {[
              { label: 'All', value: 'all' },
              { label: 'Excellent (80+)', value: 'excellent' },
              { label: 'Moderate (50-79)', value: 'moderate' },
              { label: 'Critical (<50)', value: 'critical' }
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setScoreFilter(p.value as ScoreFilter)}
                className={`text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all border font-mono ${
                  scoreFilter === p.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-cardDark text-textSecondary-light dark:text-textSecondary-dark border-borderLight dark:border-borderDark hover:border-primary hover:text-primary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sort selector dropdown */}
          <div className="lg:col-span-3 flex items-center justify-end gap-2">
            <ArrowUpDown className="text-textSecondary-light" size={14} />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-slate-50 dark:bg-[#1E293B] border border-borderLight dark:border-borderDark rounded-xl px-3 py-2 text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Score: High to Low</option>
              <option value="score-asc">Score: Low to High</option>
            </select>
          </div>

        </div>
      </Card>

      {/* Timeline Section */}
      <div className="relative">
        
        {/* Vertical Center Line */}
        <div className="absolute left-6 md:left-[50%] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none" />

        <div className="space-y-12">
          {filteredLogs.map((log, index) => {
            const project = projects.find((p) => p.id === log.projectId);
            const score = log.review?.score;
            
            // Align alternates left/right for desktop timeline, fallback to list for mobile
            const isEven = index % 2 === 0;

            let scoreColor = 'border-red-200 text-red-600 bg-red-50 dark:border-red-950/20 dark:text-red-400 dark:bg-red-950/10';
            if (score !== undefined) {
              if (score >= 80) scoreColor = 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-950/20 dark:text-emerald-400 dark:bg-emerald-950/10';
              else if (score >= 50) scoreColor = 'border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-950/20 dark:text-amber-400 dark:bg-amber-950/10';
            }

            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                key={log.id}
                className={`flex flex-col md:flex-row items-stretch md:items-center relative w-full ${
                  isEven ? 'md:flex-row-reverse' : ''
                }`}
              >
                
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-[50%] translate-x-[-50%] w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-bgDark shadow z-10 hidden md:block" />

                {/* Content block */}
                <div className="w-full md:w-[46%] px-6">
                  <Card
                    onClick={() => setSelectedLog(log)}
                    className="p-5 border hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-textSecondary-light dark:text-textSecondary-dark font-semibold">
                          <Calendar size={13} />
                          <span>{new Date(log.uploadedAt).toLocaleDateString()}</span>
                          <span className="text-[10px] opacity-60">•</span>
                          <Clock size={13} />
                          <span>{new Date(log.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h3 className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mt-1 group-hover:text-primary transition-colors">
                          {project?.code} : {project?.name}
                        </h3>
                      </div>
                      
                      {score !== undefined ? (
                        <div className={`border rounded-full py-0.5 px-2.5 text-xs font-extrabold select-none shrink-0 ${scoreColor}`}>
                          {score}%
                        </div>
                      ) : (
                        <div className="border rounded-full py-0.5 px-2.5 text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 select-none shrink-0 animate-pulse">
                          Pending AI
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark line-clamp-3 leading-relaxed mb-4">
                      {log.content}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-textSecondary-light dark:text-textSecondary-dark font-medium border-t border-slate-50 dark:border-slate-850 pt-3">
                      <span>Intern: {project?.members.find(m => m.id === log.internId)?.name || 'Unknown'}</span>
                      <span className="flex items-center gap-0.5 text-primary group-hover:underline">
                        Audit Report <ChevronRight size={12} />
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Empty column to pad the alternate timeline */}
                <div className="w-[46%] hidden md:block" />

              </motion.div>
            );
          })}

          {filteredLogs.length === 0 && (
            <Card hoverGlow={false} className="p-8 text-center text-sm text-textSecondary-light dark:text-textSecondary-dark italic">
              No matching submission logs found. Check your search filters.
            </Card>
          )}
        </div>
      </div>

      {/* Slide-out review report drawer */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-bgLight dark:bg-bgDark border-l border-borderLight dark:border-borderDark shadow-2xl p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-borderLight dark:border-borderDark/40 pb-4">
                <div>
                  <h3 className="text-base font-bold text-textPrimary-light dark:text-textPrimary-dark">Submission Detailed Report</h3>
                  <p className="text-[10px] text-textSecondary-light dark:text-textSecondary-dark">Review results evaluated dynamically by Claude-3</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg border border-borderLight dark:border-borderDark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Log context info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 border border-borderLight dark:border-borderDark rounded-xl text-xs font-semibold">
                <div>
                  <div className="text-textSecondary-light">Project Code</div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark mt-0.5">{projects.find(p => p.id === selectedLog.projectId)?.code}</div>
                </div>
                <div>
                  <div className="text-textSecondary-light">Intern Developer</div>
                  <div className="text-textPrimary-light dark:text-textPrimary-dark mt-0.5">{projects.find(p => p.id === selectedLog.projectId)?.members.find(m => m.id === selectedLog.internId)?.name || 'Unknown'}</div>
                </div>
              </div>

              {/* Submission text content */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-textSecondary-light">Submitted Work Log Text</span>
                <div className="p-4 bg-white dark:bg-cardDark border border-borderLight dark:border-borderDark rounded-xl text-sm leading-relaxed max-h-40 overflow-y-auto text-textPrimary-light dark:text-textPrimary-dark">
                  {selectedLog.content}
                </div>
              </div>

              {/* AI review card */}
              <AIReviewCard review={selectedLog.review} />

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
};
