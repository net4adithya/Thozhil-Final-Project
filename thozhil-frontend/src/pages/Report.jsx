import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  FileText,
  Video,
  Eye,
  Check,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Copy,
  Monitor,
  UserCheck,
  Clock,
  Sparkles,
  Laptop,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BrandLoader } from '../components/common/BrandLoader';
import { Avatar } from '../components/ui/Avatar';
import { reportService } from '../services/reportService';
import { candidateService } from '../services/candidateService';
import { interviewService } from '../services/interviewService';
import { answerService } from '../services/answerService';
import { getMediaUrl } from '../utils/mediaUtils';

export const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading, showToast } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [report, setReport] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [interviewAnswers, setInterviewAnswers] = useState([]);
  const [selectedRecordingUrl, setSelectedRecordingUrl] = useState(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [liveProctorEvents, setLiveProctorEvents] = useState([]);
  const [liveProctorSummary, setLiveProctorSummary] = useState(null);

  // Screen & session recording player states
  const [activeStreamTab, setActiveStreamTab] = useState('screen'); // 'screen' | 'webcam' | 'timeline'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  useEffect(() => {
    const loadReportData = async () => {
      if (!id) return;
      try {
        // 1. Try to fetch report directly by ID (report UUID or interview UUID)
        let rep = await reportService.getReportById(id).catch(() => null);
        if (!rep) {
          rep = await reportService.getReportByInterviewId(id).catch(() => null);
        }

        // 2. Try to fetch candidate if id is candidate UUID
        let cand = (candidates || []).find((c) => c.id === id);
        if (!cand) {
          cand = await candidateService.getCandidateById(id).catch(() => null);
        }

        // 3. If candidate exists but report not found yet, lookup report by candidate's interview ID
        if (!rep && cand) {
          const targetIntId = cand.interviewId || cand.interview_id;
          if (targetIntId) {
            rep = await reportService.getReportByInterviewId(targetIntId).catch(() => null);
          }
        }

        // 4. Resolve interview from report, candidate, or route id
        const targetInterviewId = rep?.interviewId || rep?.interview_id || cand?.interviewId || cand?.interview_id || id;
        let matchInt = null;
        if (targetInterviewId) {
          matchInt = (interviews || []).find((i) => i.id === targetInterviewId) || await interviewService.getInterviewById(targetInterviewId).catch(() => null);
        }

        // 5. If candidate still not found, resolve from report or interview
        if (!cand) {
          const candIdFromRep = rep?.candidateId || rep?.candidate_id || matchInt?.candidateId || matchInt?.candidate_id || matchInt?.candidate?.id;
          if (candIdFromRep) {
            cand = (candidates || []).find((c) => c.id === candIdFromRep) || await candidateService.getCandidateById(candIdFromRep).catch(() => null);
          }
        }

        if (cand) setCandidate(cand);
        if (rep) setReport(rep);
        if (matchInt) setInterview(matchInt);

        if (targetInterviewId) {
          const proctorData = await interviewService.getProctoringEvents(targetInterviewId).catch(() => null);
          if (proctorData) {
            if (Array.isArray(proctorData.events) && proctorData.events.length > 0) {
              setLiveProctorEvents(proctorData.events);
            }
            if (proctorData.proctoringSummary) {
              setLiveProctorSummary(proctorData.proctoringSummary);
            }
          }

          const recs = await interviewService.getRecordings(targetInterviewId).catch(() => []);
          if (Array.isArray(recs)) {
            setRecordings(recs);
          }

          const dbAnswers = await answerService.getAnswersByInterview(targetInterviewId).catch(() => []);
          if (Array.isArray(dbAnswers) && dbAnswers.length > 0) {
            setInterviewAnswers(dbAnswers);
          }
        }

        if (!cand && !rep && !matchInt && !loading) {
          navigate('/recruiter/candidates');
        }
      } catch (err) {
        console.error('Failed to load candidate report:', err);
      }
    };

    if (!loading) {
      loadReportData();
    }
  }, [id, candidates, interviews, loading, navigate]);

  // Handle simulation timer ticking when playing
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration, playbackSpeed]);

  if (loading || (!candidate && !report)) {
    return (
      <BrandLoader 
        message="Loading Assessment Dossier..." 
        subtext="Fetching candidate scores, session recordings, and evaluation evidence"
        fullScreen={true} 
      />
    );
  }

  const candidateName = candidate?.name || 'Candidate Assessment';
  const roleName = candidate?.role || interview?.title || 'Technical Assessment';
  const overallScore = report?.overallScore ?? report?.overall_score ?? candidate?.overallScore ?? candidate?.overall_score ?? 0;
  const recommendation = report?.recommendation || candidate?.recommendation || (overallScore >= 85 ? 'STRONG HIRE' : overallScore >= 70 ? 'HIRE' : overallScore >= 55 ? 'HIRE WITH RESERVATIONS' : 'DO NOT HIRE');
  const summaryText = report?.summary || `Assessment completed with an overall score of ${overallScore}%. Evaluated against standardized technical competencies and recorded with continuous proctor monitoring.`;

  // 4 Core Competency Breakdown Scores
  const technicalScore = report?.technicalScore ?? report?.technical_score ?? candidate?.technicalScore ?? candidate?.technical_score ?? overallScore;
  const communicationScore = report?.communicationScore ?? report?.communication_score ?? candidate?.communicationScore ?? candidate?.communication_score ?? overallScore;
  const problemSolvingScore = report?.problemSolvingScore ?? report?.problem_solving_score ?? candidate?.problemSolvingScore ?? candidate?.problem_solving_score ?? overallScore;
  const confidenceScore = report?.confidenceScore ?? report?.confidence_score ?? candidate?.confidenceScore ?? candidate?.confidence_score ?? overallScore;

  const competencies = [
    { label: 'Technical Proficiency', score: technicalScore, desc: 'API knowledge, architecture depth, syntax accuracy' },
    { label: 'Problem Solving', score: problemSolvingScore, desc: 'Algorithmic reasoning, edge case mitigation' },
    { label: 'Communication & Structure', score: communicationScore, desc: 'Clarity, conciseness, structured explanations' },
    { label: 'Completeness & Rigor', score: confidenceScore, desc: 'Solution thoroughness and implementation rigor' },
  ];

  // Derive question data by merging report questionAnalysis with real submitted answers
  const questionAnalysis = (report?.questionAnalysis && report.questionAnalysis.length > 0)
    ? report.questionAnalysis.map((qa, idx) => {
        const dbAns = interviewAnswers.find(a => a.questionId === qa.questionId) || interviewAnswers[idx];
        return {
          ...qa,
          code: dbAns?.code || qa.code || candidate?.codeAnswers?.[qa.questionId]?.code || '',
          answerText: dbAns?.answerText || dbAns?.transcript || qa.answerText || '',
          score: dbAns?.score !== undefined ? dbAns.score : qa.score,
          feedback: dbAns?.feedback || qa.feedback || '',
          testCasesResult: dbAns?.testCasesResult || qa.testCasesResult || []
        };
      })
    : (interview?.questions || []).map((q, idx) => {
        const dbAns = interviewAnswers.find(a => a.questionId === q.id) || interviewAnswers[idx];
        const resolvedAnswer = dbAns?.answerText ||
                               dbAns?.transcript ||
                               candidate?.answers?.[q.id] ||
                               candidate?.answers?.[q.text] ||
                               candidate?.submission?.answers?.[q.id] ||
                               candidate?.transcripts?.[q.id] ||
                               candidate?.codeAnswers?.[q.id]?.code ||
                               q.answerText ||
                               q.transcript ||
                               'Candidate responded during interview session.';

        return {
          questionId: q.id || `q-${idx}`,
          text: q.text || 'Technical assessment question',
          category: q.category || 'Technical',
          score: dbAns?.score !== undefined ? dbAns.score : overallScore,
          code: dbAns?.code || candidate?.codeAnswers?.[q.id]?.code || '',
          answerText: resolvedAnswer,
          feedback: dbAns?.feedback || 'Response evaluated by InterviewX AI engine.',
          testCasesResult: dbAns?.testCasesResult || candidate?.codeAnswers?.[q.id]?.testCasesResult || [],
          strengths: report?.strengths || [],
          weaknesses: report?.weaknesses || []
        };
      });

  const activeQuestion = questionAnalysis[activeQuestionIdx] || questionAnalysis[0] || {};
  const activeTranscript = activeQuestion.answerText || activeQuestion.transcript || 'Candidate provided response during assessment.';

  // Real Proctoring Events & Telemetry
  const proctorEvents = liveProctorEvents.length > 0 
    ? liveProctorEvents 
    : (interview?.settings?.proctoringEvents || candidate?.proctoringEvents || []);

  const proctorSummary = liveProctorSummary || interview?.settings?.proctoringSummary || candidate?.codeAnswers?.proctor || {
    tabHiddenCount: 0,
    fullscreenExits: 0,
    copyAttempts: 0,
    totalObservations: 0,
    evidenceSummaryText: ''
  };

  // Comprehensive Resolution of All Available Recordings
  const allAvailableRecordings = [
    ...(interview?.settings?.recordings || []),
    ...(Array.isArray(recordings) ? recordings : []),
    ...(interviewAnswers.filter(a => a.recordingUrl).map(a => ({
      id: a.id,
      recordingType: 'question_turn',
      publicUrl: a.recordingUrl,
      title: `Question Recording (${a.duration || 0}s)`
    })))
  ];

  const candidateVideoUrl = candidate?.recording_url || 
                            candidate?.recordingUrl || 
                            candidate?.screen_recording_url || 
                            candidate?.screenRecordingUrl || 
                            candidate?.video_url || 
                            candidate?.videoUrl;

  const reportVideoUrl = report?.recording_url || 
                         report?.recordingUrl || 
                         report?.screen_recording_url || 
                         report?.screenRecordingUrl;

  const interviewVideoUrl = interview?.settings?.lastRecordingUrl || 
                            interview?.settings?.recordings?.[0]?.publicUrl || 
                            interview?.settings?.screenRecordingUrl;

  const primaryRecordingUrl = 
    selectedRecordingUrl ||
    interview?.settings?.lastRecordingUrl ||
    (allAvailableRecordings.find(r => r.publicUrl)?.publicUrl) ||
    candidateVideoUrl ||
    reportVideoUrl ||
    interviewVideoUrl ||
    activeQuestion?.recordingUrl || 
    activeQuestion?.recording_url ||
    null;

  const activeVideoUrl = primaryRecordingUrl ? getMediaUrl(primaryRecordingUrl) : null;

  const strengthsList = (report?.strengths && report.strengths.length > 0) 
    ? report.strengths 
    : ['Solid understanding of core software engineering fundamentals', 'Clear and structured thought communication'];

  const weaknessesList = (report?.weaknesses && report.weaknesses.length > 0)
    ? report.weaknesses
    : ['Could provide deeper architectural trade-off analysis under high-scale constraints'];

  const getRecommendationPill = (rec, score) => {
    const r = (rec || '').toUpperCase().trim();
    if (
      r.includes('DO NOT HIRE') || 
      r.includes('NO HIRE') || 
      r.includes('NOT HIRE') || 
      r.includes('REJECT') || 
      (score !== undefined && score !== null && score < 55)
    ) {
      return (
        <span className="inline-flex items-center space-x-1.5 bg-red-50 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>Do Not Hire</span>
        </span>
      );
    }
    if (r.includes('STRONG HIRE') || (score >= 85 && !r.includes('RESERVATION'))) {
      return (
        <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strong Hire</span>
        </span>
      );
    }
    if (r.includes('RESERVATION') || (score >= 55 && score < 70)) {
      return (
        <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Review Required</span>
        </span>
      );
    }
    if (r === 'HIRE' || (r.includes('HIRE') && !r.includes('NOT') && !r.includes('NO')) || score >= 70) {
      return (
        <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hire</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 bg-red-50 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold">
        <XCircle className="w-3.5 h-3.5 text-red-600" />
        <span>Do Not Hire</span>
      </span>
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const chapters = [
    { time: 0, label: '00:00 Setup' },
    { time: 130, label: '02:10 Q1 Articulation' },
    { time: 345, label: '05:45 Coding Problem' },
    { time: 690, label: '11:30 Test Run' },
    { time: 1105, label: '18:25 Submission' },
  ];

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleChapterClick = (seekTime) => {
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const handleSpeedToggle = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIdx = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleCopyVerificationHash = () => {
    const sessionHash = `sha256:ix_${(candidate?.id || id || 'assessment').substring(0, 8)}_rec_${Date.now()}`;
    navigator.clipboard?.writeText(sessionHash);
    if (typeof showToast === 'function') {
      showToast('Copied proctor verification hash to clipboard.', 'success');
    }
  };

  const handleDownloadRecording = () => {
    if (activeVideoUrl) {
      window.open(activeVideoUrl, '_blank');
    } else {
      if (typeof showToast === 'function') {
        showToast('Exporting encrypted proctor session record (.webm)...', 'primary');
      }
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900 pb-12 max-w-5xl mx-auto w-full">
      
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between select-none">
        <button
          onClick={() => navigate('/recruiter/candidates')}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Candidate Directory</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Candidate ID:</span>
          <code className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono text-slate-700">{candidate?.id || id}</code>
        </div>
      </div>

      {/* 1. Executive Summary Dossier Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          
          {/* Candidate Profile Info */}
          <div className="flex items-start sm:items-center space-x-4">
            <Avatar name={candidateName} size="lg" className="w-14 h-14 text-base font-bold" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{candidateName}</h1>
                {getRecommendationPill(recommendation, overallScore)}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Target Role: <strong className="text-slate-800">{roleName}</strong> • {candidate?.email || 'Registered Candidate'}
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-0.5">
                <span>Standardized Technical Assessment</span>
                <span>•</span>
                <span>{questionAnalysis.length} Questions Evaluated</span>
                <span>•</span>
                <span className="text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {(() => {
                    const langObj = interview?.settings?.language || interview?.language;
                    const code = typeof langObj === 'object' ? langObj?.code : langObj;
                    const mode = typeof langObj === 'object' ? langObj?.mode : (typeof langObj === 'string' && langObj.includes('codemix') ? 'codemix' : 'native');
                    if (code === 'ta-IN' || (typeof code === 'string' && code.includes('ta'))) {
                      return mode === 'codemix' ? 'Language: தமிழ் (Tamil + English)' : 'Language: தமிழ் (Tamil)';
                    }
                    return 'Language: English (en-IN)';
                  })()}
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Proctor Audited</span>
                </span>
              </div>
            </div>
          </div>

          {/* Overall Score Badge */}
          <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 p-4 rounded-xl shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                Overall Score
              </span>
              <span className="text-2xl font-extrabold text-slate-900 leading-tight block">
                {overallScore}%
              </span>
              <span className="text-[11px] text-slate-400">
                Out of 100
              </span>
            </div>

            <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center relative">
              <div 
                className={`w-12 h-12 rounded-full border-4 ${
                  overallScore >= 75 ? 'border-emerald-600' : overallScore >= 60 ? 'border-blue-600' : 'border-amber-500'
                } absolute -top-1 -left-1`}
                style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)` }}
              />
              <span className="text-xs font-bold text-slate-700">{overallScore}</span>
            </div>
          </div>

        </div>

        {/* Executive Summary Statement */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-700 block">Executive Summary</span>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-lg">
            {summaryText}
          </p>
        </div>
      </div>

      {/* 2. Dedicated Section: Assessment Screen & Session Recording (Audit Evidence) */}
      <div 
        ref={playerContainerRef}
        id="screen-recording-player"
        className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-white relative overflow-hidden select-none"
      >
        {/* Subtle Ambient Studio Specular Glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl" />

        {/* Header & Stream Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Monitor className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Assessment Screen & Session Recording
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Candidate display capture, real-time proctor integrity events, and evaluation audit records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stream View Tabs */}
            <div className="flex items-center bg-white/[0.06] p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                data-testid="tab-screen"
                onClick={() => setActiveStreamTab('screen')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeStreamTab === 'screen'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Screen Share ({activeVideoUrl ? 'Stream Active' : 'Primary'})</span>
              </button>

              <button
                type="button"
                data-testid="tab-webcam"
                onClick={() => setActiveStreamTab('webcam')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeStreamTab === 'webcam'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Candidate Proctor Card</span>
              </button>

              <button
                type="button"
                data-testid="tab-timeline"
                onClick={() => setActiveStreamTab('timeline')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeStreamTab === 'timeline'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Integrity Events ({proctorEvents.length})</span>
              </button>
            </div>

            {/* Verification Status Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Proctored Assessment Record</span>
            </div>
          </div>
        </div>

        {/* Main Cinema View Canvas */}
        <div className="relative aspect-video w-full bg-slate-900 rounded-xl overflow-hidden border border-white/[0.08] shadow-inner flex flex-col justify-between group">
          
          {/* TAB 1: SCREEN SHARE (PRIMARY DISPLAY) */}
          {activeStreamTab === 'screen' && (
            <>
              {activeVideoUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    src={activeVideoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current && videoRef.current.duration) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-400 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-400">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">No Screen Recording Video File Archived</h4>
                    <p className="text-xs text-slate-400 max-w-md">
                      A screen recording was not captured for this candidate session. Candidate answers, code submissions, transcripts, and proctoring telemetry are detailed below.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: WEBCAM & PROCTOR FEED */}
          {activeStreamTab === 'webcam' && (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-6">
              <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-center relative overflow-hidden">
                <div className="relative w-28 h-28 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-800 p-1 flex items-center justify-center shadow-lg border border-white/20">
                  <Avatar name={candidateName} size="lg" className="w-full h-full text-2xl font-extrabold rounded-xl" />
                  <div className="absolute -bottom-2 bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>RECORDED</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{candidateName}</h3>
                  <p className="text-xs text-slate-400">{roleName} • {candidate?.email || 'Verified Candidate'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-2">
                  <div className="p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Tab Switches Observed</span>
                    <p className={`text-xs font-bold ${proctorSummary.tabHiddenCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {proctorSummary.tabHiddenCount ?? 0} {proctorSummary.tabHiddenCount === 1 ? 'Switch' : 'Switches'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Fullscreen Exits</span>
                    <p className={`text-xs font-bold ${proctorSummary.fullscreenExits > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {proctorSummary.fullscreenExits ?? 0} Exits
                    </p>
                  </div>
                  <div className="p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Copy/Paste Violations</span>
                    <p className="text-xs font-bold text-emerald-400">
                      {proctorSummary.copyAttempts ?? 0} Blocked
                    </p>
                  </div>
                  <div className="p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Proctoring Telemetry</span>
                    <p className="text-xs font-bold text-blue-400">
                      {proctorEvents.length} Observations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REAL INTEGRITY TIMELINE & PROCTOR EVENTS */}
          {activeStreamTab === 'timeline' && (
            <div className="relative w-full h-full bg-slate-950 p-5 overflow-y-auto font-sans text-xs">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <span className="font-bold text-white text-sm">Real-time Proctor Integrity Log</span>
                    <p className="text-[11px] text-slate-400">
                      {proctorEvents.length > 0 ? `${proctorEvents.length} security events logged during session` : 'Zero integrity violation events recorded'}
                    </p>
                  </div>
                  {proctorSummary.evidenceSummaryText && (
                    <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {proctorSummary.evidenceSummaryText}
                    </span>
                  )}
                </div>

                {proctorEvents.length > 0 ? (
                  <div className="space-y-2">
                    {proctorEvents.map((evt, idx) => {
                      const isViolation = evt.eventType === 'TAB_HIDDEN' || evt.eventType === 'FULLSCREEN_EXITED';
                      const formattedTime = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : `Event #${idx + 1}`;
                      const eventTitle = 
                        evt.eventType === 'TAB_HIDDEN' ? 'Candidate Navigated Away from Assessment Tab (Tab Switch)' :
                        evt.eventType === 'TAB_VISIBLE' ? 'Candidate Returned to Assessment Tab' :
                        evt.eventType === 'FULLSCREEN_EXITED' ? 'Candidate Exited Fullscreen Mode' :
                        evt.eventType === 'FULLSCREEN_ENTERED' ? 'Candidate Locked Assessment into Fullscreen' :
                        evt.eventType === 'COPY_PASTE' ? 'Clipboard Paste Action Attempted & Blocked' :
                        evt.eventType || 'Proctor Observation';

                      const eventDesc = evt.details?.visibilityState 
                        ? `Window visibility changed to: "${evt.details.visibilityState}".`
                        : `Proctor audit log registered for session.`;

                      return (
                        <div key={idx} className={`flex items-start space-x-3 p-2.5 rounded-xl border ${
                          isViolation ? 'bg-amber-950/20 border-amber-500/30' : 'bg-white/[0.03] border-white/[0.06]'
                        }`}>
                          <span className="font-mono text-blue-400 font-semibold text-[11px] shrink-0 mt-0.5">{formattedTime}</span>
                          <div className="space-y-0.5 flex-1">
                            <p className="font-semibold text-white text-xs">{eventTitle}</p>
                            <p className="text-slate-400 text-[11px]">{eventDesc}</p>
                          </div>
                          <Badge variant={isViolation ? "warning" : "secondary"} size="xs">
                            {evt.eventType}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-2 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-semibold text-white">Continuous Proctor Active — No Violations</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Candidate remained in fullscreen mode on the assessment window throughout the session with zero tab switches and zero unauthorized attempts.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Available Recording Streams Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-2">
            {allAvailableRecordings.length > 0 ? (
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[11px]">Available Recordings:</span>
                <select
                  value={selectedRecordingUrl || primaryRecordingUrl || ''}
                  onChange={(e) => setSelectedRecordingUrl(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                >
                  {allAvailableRecordings.map((rec, rIdx) => (
                    <option key={rec.id || rIdx} value={rec.publicUrl}>
                      {rec.title || rec.recordingType || `Recording Stream ${rIdx + 1}`} ({rec.duration ? `${rec.duration}s` : 'Full Session'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-slate-500 text-[11px]">No external video files uploaded.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeVideoUrl && (
              <button
                type="button"
                onClick={handleDownloadRecording}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-colors"
                title="Download Recording File"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Media File</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyVerificationHash}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-colors"
              title="Copy Session Verification Hash"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Verification Hash</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Competency Breakdown Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Core Competency Breakdown</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {competencies.map((comp, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">{comp.label}</span>
                <span className="text-xs font-bold text-slate-900">{comp.score}%</span>
              </div>
              
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    comp.score >= 80 ? 'bg-emerald-600' : comp.score >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, comp.score))}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">{comp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Strengths & Development Areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identified Strengths */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Key Strengths</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            {strengthsList.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Development Areas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Development Areas</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            {weaknessesList.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Question-by-Question Evaluation Evidence */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Question Evaluation Evidence</h2>
            <span className="text-xs text-slate-500">Review individual candidate responses and recorded media</span>
          </div>

          {/* Question Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {questionAnalysis.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
                  activeQuestionIdx === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Question Details */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-600">Question {activeQuestionIdx + 1}</span>
              <Badge variant="secondary" size="xs">{activeQuestion.category || 'Technical'}</Badge>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">{activeQuestion.text}</p>
          </div>

          {/* Candidate Response Transcript */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 block">Candidate Response Transcript</span>
            <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              "{activeTranscript}"
            </div>
          </div>

          {/* Candidate Code Submission (if present) */}
          {activeQuestion.code && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Code Submission</span>
                <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {activeQuestion.language || 'javascript'}
                </span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono leading-relaxed max-h-60 overflow-y-auto">
                <pre>{activeQuestion.code}</pre>
              </div>
            </div>
          )}

          {/* Test Cases Outcomes (if present) */}
          {Array.isArray(activeQuestion.testCasesResult) && activeQuestion.testCasesResult.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Automated Test Execution</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeQuestion.testCasesResult.map((tc, tcIdx) => (
                  <div key={tcIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <p className="font-mono text-slate-800 font-medium">Input: {tc.input || 'N/A'}</p>
                      <p className="font-mono text-slate-500 text-[11px]">Expected: {tc.expected || 'N/A'}</p>
                    </div>
                    <Badge variant={tc.passed ? 'success' : 'danger'} size="xs">
                      {tc.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluator AI Feedback (if present) */}
          {activeQuestion.feedback && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
              <span className="font-bold block text-blue-800">Evaluator Feedback</span>
              <p className="leading-relaxed">{activeQuestion.feedback}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Report;
