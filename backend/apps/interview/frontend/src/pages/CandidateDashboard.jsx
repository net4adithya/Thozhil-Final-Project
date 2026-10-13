import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Video, 
  Clock, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  AlertCircle,
  RefreshCw,
  User,
  ShieldCheck,
  Award,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BrandLoader } from '../components/common/BrandLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { interviewService } from '../services/interviewService';

export const CandidateDashboard = () => {
  const { user } = useAuth();
  const { candidates, templates, loading: appLoading, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const qTab = searchParams.get('tab');
  const qCandId = searchParams.get('candidateId');
  const qIntId = searchParams.get('interviewId');

  const [activeTab, setActiveTab] = useState(
    qTab && ['all', 'assigned', 'in_progress', 'practice', 'completed'].includes(qTab) ? qTab : 'all'
  );

  const [candidateInterviews, setCandidateInterviews] = useState([]);
  const [fetchingInterviews, setFetchingInterviews] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Determine active candidate identity
  const activeCandidate = useMemo(() => {
    // 1. Direct candidate ID from URL query
    if (qCandId && candidates?.length > 0) {
      const match = candidates.find((c) => c.id === qCandId);
      if (match) return match;
    }

    // 2. Direct candidate from auth session
    if (user?.candidateId && candidates?.length > 0) {
      const match = candidates.find((c) => c.id === user.candidateId);
      if (match) return match;
    }

    // 3. Match by user email if candidate
    if (user?.email && candidates?.length > 0) {
      const match = candidates.find((c) => c.email?.toLowerCase().trim() === user.email.toLowerCase().trim());
      if (match) return match;
    }

    // 4. Fallback to active candidate ID in session storage
    const storedCandId = typeof window !== 'undefined' ? sessionStorage.getItem('interviewx_active_candidate_id') : null;
    if (storedCandId && candidates?.length > 0) {
      const match = candidates.find((c) => c.id === storedCandId);
      if (match) return match;
    }

    // 5. Default fallback to candidate with assigned interview or first candidate
    const withInt = candidates?.find((c) => c.interviewId || c.interview_id);
    return withInt || candidates?.[0] || null;
  }, [qCandId, user, candidates]);

  // Sync candidate ID in session storage
  useEffect(() => {
    if (activeCandidate?.id) {
      try {
        sessionStorage.setItem('interviewx_active_candidate_id', activeCandidate.id);
      } catch (_) {}
    }
  }, [activeCandidate]);

  // Fetch candidate-scoped interviews strictly from the backend
  const loadCandidateInterviews = useCallback(async () => {
    if (!activeCandidate?.id) {
      setFetchingInterviews(false);
      return;
    }

    try {
      setFetchingInterviews(true);
      setFetchError(null);

      // Dedicated candidate-scoped backend call
      const scopedList = await interviewService.getInterviews({
        candidateId: activeCandidate.id
      });

      // De-duplicate any multiple joins
      const uniqueMap = new Map();
      (scopedList || []).forEach((item) => {
        if (item?.id && !uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });

      setCandidateInterviews(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('[CandidateDashboard] Scoped interview load error:', err);
      setFetchError(err.message || "We couldn't load your interviews.");
    } finally {
      setFetchingInterviews(false);
    }
  }, [activeCandidate?.id]);

  useEffect(() => {
    loadCandidateInterviews();
  }, [loadCandidateInterviews]);

  // Helper to check if an interview is completed
  const isInterviewCompleted = (int) => {
    if (!int) return false;
    if (int.status === 'Completed' || int.status === 'Evaluated') return true;
    if (typeof window !== 'undefined' && sessionStorage.getItem(`interviewx_completed_${int.id}`) === 'true') {
      return true;
    }
    if (activeCandidate?.id && typeof window !== 'undefined' && sessionStorage.getItem(`interviewx_completed_${activeCandidate.id}`) === 'true') {
      return true;
    }
    if (activeCandidate && (activeCandidate.status === 'Completed' || activeCandidate.status === 'Evaluated') && (activeCandidate.interviewId === int.id || activeCandidate.interview_id === int.id)) {
      return true;
    }
    return false;
  };

  const isInterviewInProgress = (int) => {
    if (!int || isInterviewCompleted(int)) return false;
    return int.status === 'In Progress' || int.status === 'in_progress' || int.status === 'Active_Session';
  };

  // Categorize candidate assessments into the 4 authoritative sections
  const assignedInterviews = candidateInterviews.filter((i) => !isInterviewCompleted(i) && !isInterviewInProgress(i));
  const inProgressInterviews = candidateInterviews.filter((i) => isInterviewInProgress(i));
  const completedInterviews = candidateInterviews.filter((i) => isInterviewCompleted(i));

  // Dedicated practice items (strictly separate from real hiring evaluations)
  const practiceItems = (templates || []).map((tpl) => ({
    id: tpl.id,
    title: tpl.name,
    department: tpl.department || 'Engineering',
    duration: tpl.duration || 30,
    questions: tpl.questions || [],
    description: tpl.description || 'Self-paced practice session with automated code grading and question simulation.',
    isPractice: true
  }));

  // Resolve language label cleanly
  const getLanguageLabel = (int) => {
    const langObj = int.settings?.language || int.language;
    const code = typeof langObj === 'object' ? langObj?.code : langObj;
    const mode = typeof langObj === 'object' ? langObj?.mode : (typeof langObj === 'string' && langObj.includes('codemix') ? 'codemix' : 'native');
    if (code === 'ta-IN' || (typeof code === 'string' && code.includes('ta'))) {
      return mode === 'codemix' ? 'தமிழ் + English' : 'தமிழ்';
    }
    return 'English';
  };

  // Loading state
  if (appLoading || fetchingInterviews) {
    return (
      <BrandLoader 
        message="Loading your interviews..." 
        subtext="Synchronizing your assigned technical evaluation pipeline"
        fullScreen={true} 
      />
    );
  }

  // Network Error state
  if (fetchError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">We couldn't load your interviews</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {fetchError}. Please check your network connection and try again.
          </p>
          <Button
            onClick={loadCandidateInterviews}
            variant="primary"
            size="sm"
            icon={RefreshCw}
            className="w-full"
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const hasAnyAssessments = candidateInterviews.length > 0;

  return (
    <div className="space-y-6 flex-grow flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left font-sans text-slate-900">
      
      {/* Candidate Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 select-none">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Badge variant="primary" size="xs">
              Candidate Portal
            </Badge>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Identity Verified</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {activeCandidate?.name || user?.name || 'Candidate'}
          </h1>
          <p className="text-xs text-slate-500">
            Target Track: <strong className="text-slate-800 font-semibold">{activeCandidate?.role || 'Technical Candidate'}</strong> • Account: <span className="text-slate-700 font-medium">{activeCandidate?.email || user?.email || 'Active'}</span>
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-800 font-semibold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>{assignedInterviews.length} Assigned</span>
          </div>
          {inProgressInterviews.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-800 font-semibold flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{inProgressInterviews.length} In Progress</span>
            </div>
          )}
          {completedInterviews.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 font-semibold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{completedInterviews.length} Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 select-none overflow-x-auto">
        {[
          { id: 'all', label: `All Sections (${candidateInterviews.length + practiceItems.length})` },
          { id: 'assigned', label: `Assigned (${assignedInterviews.length})` },
          ...(inProgressInterviews.length > 0 ? [{ id: 'in_progress', label: `In Progress (${inProgressInterviews.length})` }] : []),
          { id: 'completed', label: `Completed (${completedInterviews.length})` },
          { id: 'practice', label: `Practice Sandbox (${practiceItems.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: ASSIGNED (Pending / Ready to take) */}
      {(activeTab === 'all' || activeTab === 'assigned') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Assigned Interviews ({assignedInterviews.length})</span>
            </h2>
            <span className="text-[11px] text-blue-700 font-medium">Hiring Assessments</span>
          </div>

          {assignedInterviews.length === 0 ? (
            <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-600">You don't have any pending assigned interviews.</p>
              <p className="text-[11px] text-slate-400">All assigned assessments have been submitted or none are pending your action.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedInterviews.map((int) => {
                const isLive = int.type === 'live' || int.interviewType === 'live';
                const duration = int.duration || 30;
                const langLabel = getLanguageLabel(int);

                return (
                  <div
                    key={int.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all duration-200 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>{isLive ? 'Live Interactive AI Interview' : 'Recorded Technical Assessment'}</span>
                        </span>
                        <Badge variant="primary" size="xs">
                          Ready to Take
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {int.title || int.jobRole || 'Technical Assessment'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {int.description || `Technical competency evaluation for ${int.jobRole || int.title || 'engineering role'}.`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{duration} mins</span>
                        </span>
                        <span>•</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {langLabel}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">
                          {int.questions?.length || 0} Questions
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        <span>Self-paced window</span>
                      </div>
                      <Button
                        onClick={() => {
                          if (activeCandidate?.id) {
                            try { sessionStorage.setItem('interviewx_active_candidate_id', activeCandidate.id); } catch (_) {}
                          }
                          navigate(`/candidate/interviews/${int.id}/device-check`);
                        }}
                        variant="primary"
                        size="sm"
                        icon={ArrowRight}
                        iconPosition="right"
                      >
                        Start Assessment
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: IN PROGRESS */}
      {(activeTab === 'all' || activeTab === 'in_progress') && inProgressInterviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>In Progress Assessments ({inProgressInterviews.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressInterviews.map((int) => (
              <div
                key={int.id}
                className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                      Session Active
                    </span>
                    <span className="text-xs font-semibold text-amber-700 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{int.duration || 30} mins</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{int.title || int.jobRole}</h3>
                  <p className="text-xs text-slate-500">You have an active session in progress. Resume to complete your assessment.</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    onClick={() => {
                      if (activeCandidate?.id) {
                        try { sessionStorage.setItem('interviewx_active_candidate_id', activeCandidate.id); } catch (_) {}
                      }
                      navigate(`/candidate/interviews/${int.id}/device-check`);
                    }}
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Resume Assessment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: PRACTICE (STRICTLY SEPARATED) */}
      {(activeTab === 'all' || activeTab === 'practice') && (
        <div className="space-y-4 pt-2">
          {/* Distinct Practice Banner */}
          <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-blue-800/50">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-blue-300" />
                <span>Ungraded Sandbox</span>
              </span>
              <h2 className="text-base font-bold text-white">Candidate Practice Sandbox</h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Test your camera, microphone, and coding editor in a safe, unmonitored environment before your official hiring assessment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/candidate/practice')}
                variant="primary"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                className="text-xs"
              >
                Open Practice Hub
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {practiceItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 shadow-xs transition-colors group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-slate-500" />
                      <span>Practice Challenge</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{item.duration} mins</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <Button
                  onClick={() => navigate('/candidate/practice')}
                  variant="secondary"
                  size="xs"
                  className="w-full"
                >
                  Launch Practice Sandbox
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: COMPLETED ASSESSMENTS */}
      {(activeTab === 'all' || activeTab === 'completed') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed Assessments ({completedInterviews.length})</span>
            </h2>
            <span className="text-[11px] text-emerald-700 font-medium">Submitted & Verified</span>
          </div>

          {completedInterviews.length === 0 ? (
            <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
              No completed assessments yet. Once you complete an assessment, your verified submission receipt will appear here.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              {completedInterviews.map((int) => (
                <div key={int.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{int.title || int.jobRole || 'Assessment Session'}</h4>
                      <p className="text-[11px] text-slate-500">
                        Submitted & securely recorded • {getLanguageLabel(int)} • {int.type === 'live' ? 'Live Session' : 'Recorded Assessment'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      onClick={() => navigate(`/candidate/interviews/${int.id}/completed`)}
                      size="xs"
                      variant="secondary"
                    >
                      View Receipt & Dossier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* "What Happens After Completion?" Explanation Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2 select-none">
        <div className="flex items-center space-x-2 font-bold text-slate-900">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>What happens after you complete your assessment?</span>
        </div>
        <p className="leading-relaxed">
          Your answers, code solutions, and media recordings are objectively processed for technical depth, relevance, and conceptual accuracy. The hiring team reviews your verified dossier along with competency metrics. You can review your submission confirmation at any time in the <strong>Completed</strong> tab.
        </p>
      </div>

    </div>
  );
};

export default CandidateDashboard;
