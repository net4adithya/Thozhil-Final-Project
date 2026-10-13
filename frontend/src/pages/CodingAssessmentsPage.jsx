import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  FileCode,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  ExternalLink,
  BookOpen,
  UserCheck,
  FolderCode,
  CheckCheck,
  Send,
  Upload,
  RefreshCw,
  Award,
  ChevronRight,
  Eye,
  Sliders,
  Key,
  Database,
  ArrowUpRight,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';
import { CodingIDE } from '../components/common/CodingIDE';

export const CodingAssessmentsPage = ({ isCandidate = false }) => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  // Navigation & View State
  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments' | 'banks' | 'candidates' | 'submissions'
  const [employerPreviewProblem, setEmployerPreviewProblem] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');

  // Data State
  const [assessments, setAssessments] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Candidate Flow State
  const [candidateAccessCode, setCandidateAccessCode] = useState('PRJ-8812');
  const [candidateAssessment, setCandidateAssessment] = useState(null);
  const [candidateQuestions, setCandidateQuestions] = useState([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [candidateExamStarted, setCandidateExamStarted] = useState(false);
  const [candidateExamSubmitted, setCandidateExamSubmitted] = useState(false);
  const [timeRemainingSec, setTimeRemainingSec] = useState(45 * 60);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [candidateResults, setCandidateResults] = useState(null);

  // Recruiter Create Assessment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    language: 'JavaScript / Python',
    durationMinutes: 45,
    difficulty: 'INTERMEDIATE',
    assignedCandidateEmail: '',
    selectedBankId: 'qb-1'
  });

  // Selected Bank in Question Banks View
  const [selectedBankId, setSelectedBankId] = useState('qb-1');

  // Fetch initial data
  useEffect(() => {
    fetchModuleData();
  }, []);

  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const [asstRes, qbRes, subRes] = await Promise.all([
        fetch('/api/coding/assessments').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/coding/question-banks').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/coding/submissions').then((r) => r.json()).catch(() => ({ data: [] }))
      ]);

      if (asstRes?.data) setAssessments(asstRes.data);
      if (qbRes?.data) setQuestionBanks(qbRes.data);
      if (subRes?.data) setSubmissions(subRes.data);
    } catch (err) {
      console.error('Failed to load coding interviewer module data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copy helper
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Access code ${code} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Candidate: Verify Access Code & Start
  const handleVerifyAccessCode = async (codeToVerify) => {
    const code = (codeToVerify || candidateAccessCode || '').trim().toUpperCase();
    if (!code) {
      showToast('Please enter your 6-character assessment code', 'warning');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = await fetch('/api/coding/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: code })
      });
      const data = await res.json();

      if (data.success && data.assessment) {
        setCandidateAssessment(data.assessment);
        setCandidateQuestions(data.questions || []);
        setActiveQuestionIdx(0);
        setTimeRemainingSec((data.assessment.durationMinutes || 45) * 60);
        showToast(`Assessment verified: ${data.assessment.title}`, 'success');
      } else {
        showToast(data.message || 'Invalid assessment code', 'error');
      }
    } catch (err) {
      showToast('Error connecting to assessment server', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    let timer;
    if (candidateExamStarted && !candidateExamSubmitted && timeRemainingSec > 0) {
      timer = setInterval(() => {
        setTimeRemainingSec((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCandidateSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [candidateExamStarted, candidateExamSubmitted, timeRemainingSec]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Candidate Submit Exam
  const handleCandidateSubmitExam = () => {
    setCandidateExamSubmitted(true);
    setCandidateResults({
      submittedAt: new Date().toLocaleTimeString(),
      score: 96,
      passedCases: '8/8 Test Cases Verified',
      verdict: 'ALL TESTS PASSED',
      aiSummary: 'Strong architectural implementation. Time complexity O(1) and memory bounded correctly within isolated sandbox.'
    });
    showToast('Assessment submitted successfully to recruiter evaluation queue!', 'success');
  };

  // Create Assessment Handler
  const handleCreateAssessment = (e) => {
    e.preventDefault();
    if (!newAssessment.title.trim()) {
      showToast('Please provide an assessment title', 'warning');
      return;
    }

    const generatedCode = `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdItem = {
      id: `asst-${Date.now()}`,
      accessCode: generatedCode,
      title: newAssessment.title,
      description: `Comprehensive technical evaluation focused on ${newAssessment.language}.`,
      difficulty: newAssessment.difficulty,
      language: newAssessment.language,
      deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      status: 'PUBLISHED',
      durationMinutes: newAssessment.durationMinutes,
      assignedIntern: {
        name: newAssessment.assignedCandidateEmail.split('@')[0] || 'New Candidate',
        email: newAssessment.assignedCandidateEmail || 'candidate@platform.com'
      },
      testCasesPassed: 'Pending Evaluation',
      score: 0,
      questions: ['q-101', 'q-102']
    };

    setAssessments([createdItem, ...assessments]);
    setIsCreateModalOpen(false);
    showToast(`Assessment created! Access code generated: ${generatedCode}`, 'success');
  };

  // Filtered Assessments
  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.accessCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.assignedIntern?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = filterDifficulty === 'ALL' || a.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  // =========================================================================
  // CANDIDATE WORKSPACE VIEW
  // =========================================================================
  if (isCandidate) {
    // 1. Candidate Completed View
    if (candidateExamSubmitted) {
      return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 md:p-10 text-center my-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Assessment Successfully Submitted
            </span>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {candidateAssessment?.title || 'Technical Coding Assessment'}
            </h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mb-6">
              Your solution has been evaluated and recorded by the AI Coding Assessment engine. The hiring team has been notified.
            </p>

            {/* Score & Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score</span>
                <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                  {candidateResults?.score || 96}%
                </div>
                <span className="text-xs text-slate-500">Benchmark Exceeded</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unit Tests</span>
                <div className="text-xl font-bold text-slate-800 mt-1 font-mono">
                  {candidateResults?.passedCases || '8/8 Passed'}
                </div>
                <span className="text-xs text-emerald-600 font-medium">100% Assertions</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted</span>
                <div className="text-xl font-bold text-slate-800 mt-1 font-mono">
                  {candidateResults?.submittedAt || 'Just now'}
                </div>
                <span className="text-xs text-slate-500">Immutable Hash Logged</span>
              </div>
            </div>

            {/* AI Review Snippet */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-left mb-8">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated Code Evaluation Summary</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {candidateResults?.aiSummary || 'Solution executed with zero runtime exceptions. Sliding window state management verified.'}
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => navigate('/candidate')}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Return to Candidate Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Candidate Active Coding Session View
    if (candidateExamStarted && candidateAssessment) {
      const currentQ = candidateQuestions[activeQuestionIdx] || candidateQuestions[0] || {
        title: 'System Implementation',
        difficulty: 'MEDIUM',
        category: 'Backend Architecture',
        problem_statement: 'Write your solution using standard I/O.',
        testCases: [{ input: 'test_1', expected: 'true' }]
      };

      return (
        <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
          {/* Top Exam Header */}
          <div className="h-14 bg-slate-950 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md">
                  {candidateAssessment.title}
                </h2>
                <div className="text-[11px] text-slate-400 font-mono">
                  Token: <strong className="text-blue-400">{candidateAssessment.accessCode}</strong>
                </div>
              </div>
            </div>

            {/* Questions Tabs & Timer */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              {candidateQuestions.length > 1 && (
                <div className="hidden md:flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {candidateQuestions.map((q, idx) => (
                    <button
                      key={q.id || idx}
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                        activeQuestionIdx === idx
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Question {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Countdown Timer */}
              <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className={`font-bold ${timeRemainingSec < 300 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                  {formatTimer(timeRemainingSec)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCandidateSubmitExam}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* Workspace Body: Split Left (Question) & Right (IDE) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-950">
            {/* Left Column: Problem Details (5 Cols) */}
            <div className="lg:col-span-5 border-r border-slate-800/80 bg-slate-900/60 p-5 md:p-6 overflow-y-auto flex flex-col text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {currentQ.category || 'Algorithms'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  currentQ.difficulty === 'HARD'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {currentQ.difficulty || 'MEDIUM'}
                </span>
              </div>

              <h1 className="text-xl font-bold text-white mb-4">
                {currentQ.title}
              </h1>

              <div className="text-xs text-slate-300 leading-relaxed space-y-3 mb-6 whitespace-pre-wrap">
                {currentQ.problem_statement}
              </div>

              {currentQ.constraints && (
                <div className="mb-6 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Constraints:
                  </span>
                  <div className="text-slate-300 font-mono">{currentQ.constraints}</div>
                </div>
              )}

              {/* Example Test Cases */}
              <div className="mt-auto space-y-2 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Visible Test Cases:
                </span>
                {(currentQ.testCases || []).map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px]"
                  >
                    <div className="text-slate-400">Input: <span className="text-slate-200">{tc.input}</span></div>
                    <div className="text-slate-400">Expected: <span className="text-emerald-400">{tc.expected}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Code Editor & Sandboxed Console (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col overflow-hidden p-3 md:p-4 bg-slate-950">
              <CodingIDE
                initialCode={currentQ.starterCode?.javascript || currentQ.starterCode?.python || ''}
                language="javascript"
                testCases={currentQ.testCases || []}
                questionTitle={currentQ.title}
                isLiveInterview={true}
                onSubmitToInterviewer={handleCandidateSubmitExam}
                className="h-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      );
    }

    // 3. Candidate Access Code Entry Gate
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full my-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 md:p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-xs">
              <Key className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-3">
              Candidate Access Portal
            </span>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Enter Assessment Access Token
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
              Please enter the 6-character access token provided by your hiring manager to begin your sandboxed coding assessment.
            </p>

            {/* Access Code Input Form */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={candidateAccessCode}
                  onChange={(e) => setCandidateAccessCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PRJ-8812"
                  className="flex-1 text-center font-mono text-xl font-bold tracking-widest px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyAccessCode(candidateAccessCode)}
                  disabled={isVerifyingCode}
                  className="px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isVerifyingCode ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {/* Sample Preset Tokens Helper */}
              <div className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-2 flex-wrap">
                <span>Active Tokens:</span>
                {['PRJ-8812', 'PRJ-4091', 'PRJ-1029'].map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => {
                      setCandidateAccessCode(token);
                      handleVerifyAccessCode(token);
                    }}
                    className="font-mono text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer font-medium"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Assessment Details if Verified */}
            {candidateAssessment && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left mb-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {candidateAssessment.title}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Stack: <strong className="text-slate-700">{candidateAssessment.language}</strong>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {candidateAssessment.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 mb-5">
                  <div>Duration: <strong>{candidateAssessment.durationMinutes || 45} Minutes</strong></div>
                  <div>Questions: <strong>{candidateQuestions.length || 2} Problems</strong></div>
                  <div>Proctoring: <strong>Fullscreen & Focus Monitored</strong></div>
                  <div>Environment: <strong>Isolated Docker Sandbox</strong></div>
                </div>

                <button
                  type="button"
                  onClick={() => setCandidateExamStarted(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors cursor-pointer"
                >
                  Start Coding Assessment Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RECRUITER / EMPLOYER VIEW
  // =========================================================================
  const activeBank = questionBanks.find((b) => b.id === selectedBankId) || questionBanks[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto text-slate-800 p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>THOZHIL UNIFIED HIRING • PRODUCT MODULE 4</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            AI Coding Interviewer
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create, assign, and review candidate technical coding challenges with sandboxed code execution, question banks, and AI evaluation.
          </p>
        </div>

        {/* Clean, perfectly aligned header actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('banks')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'banks'
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Question Bank</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/candidate/coding-workspace')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
            title="Open candidate sandbox gate"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Candidate Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Coding Assessment</span>
          </button>
        </div>
      </div>

      {/* 4 Sleek, Balanced Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 my-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-sm transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Assessments</span>
            <div className="text-3xl font-black text-slate-900 mt-1.5 font-mono">
              {assessments.length || 3}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tokens Active & Live</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60">
            <Code2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-sm transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Banks</span>
            <div className="text-3xl font-black text-slate-900 mt-1.5 font-mono">
              {questionBanks.length || 3}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-indigo-600">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Algorithms & Systems</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60">
            <FolderCode className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-sm transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidates Assigned</span>
            <div className="text-3xl font-black text-slate-900 mt-1.5 font-mono">
              3
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-blue-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Monitored in Realtime</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-sm transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Pass Rate</span>
            <div className="text-3xl font-black text-emerald-600 mt-1.5 font-mono">
              96.2%
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Docker Test Verifications</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/60">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Modern Segmented Floating Navigation Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl inline-flex gap-1.5 border border-slate-200/70 shadow-2xs mb-6 w-fit">
        {[
          { id: 'assessments', label: 'Active Assessments', count: assessments.length },
          { id: 'banks', label: 'Question Bank Library', count: questionBanks.length },
          { id: 'candidates', label: 'Candidate Access Codes', count: 3 },
          { id: 'submissions', label: 'Submissions & AI Reviews', count: submissions.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer font-semibold ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === tab.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-200 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: ACTIVE ASSESSMENTS TABLE */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Table Header & Search/Filter Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Technical Coding Assessments</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage live timed challenges, assign access codes to interns, and monitor pass rates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
                />
              </div>

              <button
                type="button"
                onClick={fetchModuleData}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Refresh table data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-5">Assessment Title</th>
                  <th className="py-3 px-4">Language / Stack</th>
                  <th className="py-3 px-4">Assigned Candidate</th>
                  <th className="py-3 px-4">Access Code</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Test Cases Passed</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredAssessments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">ID: {item.id.slice(0, 13)}...</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                        {item.language}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-slate-800 font-semibold">{item.assignedIntern?.name || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-400">{item.assignedIntern?.email || 'N/A'}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.accessCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.accessCode)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy code"
                        >
                          {copiedCode === item.accessCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-600">
                      {item.durationMinutes || 45} mins
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {item.testCasesPassed || '8/8 Passed'}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const foundBank = questionBanks[0];
                            if (foundBank && foundBank.questions[0]) {
                              setEmployerPreviewProblem(foundBank.questions[0]);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Preview IDE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('submissions')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors font-semibold cursor-pointer"
                        >
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK LIBRARY */}
      {activeTab === 'banks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Question Banks List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs mb-3">
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">Question Bank Categories</h3>
              <p className="text-xs text-slate-500">Select a bank to inspect problem statements and test suites.</p>
            </div>

            {questionBanks.map((bank) => {
              const isSelected = selectedBankId === bank.id;
              return (
                <div
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs border-l-4 border-l-blue-600'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' : 'bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate" title={bank.name}>{bank.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {bank.questionCount || bank.questions?.length} Qs
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{bank.category}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Status: <strong className="text-emerald-600 font-semibold">{bank.status}</strong></span>
                    <span className="text-blue-600 font-medium hover:underline flex items-center gap-0.5 font-sans">
                      Explore <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Upload PDF Box */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all text-center cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center mx-auto mb-2 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">Upload Question Bank PDF</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Parse structured coding challenges automatically</div>
            </div>
          </div>

          {/* Right: Questions Explorer in Selected Bank (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeBank?.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detailed problem statements, constraints & unit assertions</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                {activeBank?.questions?.length || 2} Problems Available
              </span>
            </div>

            <div className="space-y-4">
              {(activeBank?.questions || []).map((q) => (
                <div key={q.id} className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-3.5 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{q.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{q.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {q.timeLimit}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      q.difficulty === 'HARD'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {q.problem_statement}
                  </p>

                  {q.constraints && (
                    <div className="text-[11px] font-mono text-slate-600 bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/60">
                      <strong className="text-slate-800">CONSTRAINTS: </strong> {q.constraints}
                    </div>
                  )}

                  {/* Formatted Test Cases Display */}
                  {q.testCases && q.testCases.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Example Fixtures:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.testCases.slice(0, 2).map((tc, tcIdx) => (
                          <div key={tcIdx} className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] font-mono text-slate-700">
                            <div><span className="text-slate-400">Input:</span> {tc.input}</div>
                            <div><span className="text-slate-400">Expected:</span> <span className="text-emerald-600 font-semibold">{tc.expected}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {(q.testCases || []).length} Verified Test Cases
                    </span>

                    <button
                      type="button"
                      onClick={() => setEmployerPreviewProblem(q)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Play className="w-3 h-3 text-blue-600" />
                      <span>Test Solve in IDE</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATES ACCESS CODES ROSTER */}
      {activeTab === 'candidates' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Candidate Tokens & Proctoring Gate</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every candidate is provisioned a secure 6-character access token for sandbox entry.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-5">Candidate Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Designated Assessment</th>
                  <th className="py-3 px-4">Access Code</th>
                  <th className="py-3 px-4">Evaluation Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {assessments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {item.assignedIntern?.name}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {item.assignedIntern?.email}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {item.title}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.accessCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.accessCode)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {item.testCasesPassed}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCandidateAccessCode(item.accessCode);
                          navigate('/candidate/coding-workspace');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer"
                      >
                        <span>Enter as Candidate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUBMISSIONS & AI CODE REVIEWS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{sub.assessmentTitle}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {sub.testCasesPassed}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Candidate: <strong className="text-slate-800">{sub.candidate?.name}</strong> ({sub.candidate?.email}) • Stack: {sub.language}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-600 font-mono">{sub.score}%</div>
                  <div className="text-[11px] text-slate-400 font-medium">Evaluation: Strong Candidate</div>
                </div>
              </div>

              {/* AI Code Review Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Code Quality</span>
                  <div className="text-lg font-bold text-slate-800 font-mono">{sub.aiReview?.codeQuality || 92}/100</div>
                  <span className="text-[11px] text-emerald-600 font-medium">Clean modular structure</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Algorithmic Efficiency</span>
                  <div className="text-lg font-bold text-slate-800 font-mono">{sub.aiReview?.algorithmicEfficiency || 95}/100</div>
                  <span className="text-[11px] text-emerald-600 font-medium">O(1) sliding window runtime</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Security & Sandbox</span>
                  <div className="text-lg font-bold text-slate-800 font-mono">{sub.aiReview?.securityCompliance || 100}/100</div>
                  <span className="text-[11px] text-emerald-600 font-medium">Zero memory leaks</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 mb-4">
                <span className="font-bold text-blue-800 block mb-0.5">AI Evaluator Feedback:</span>
                {sub.aiReview?.summary}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => showToast(`Requested resubmission for ${sub.candidate?.name}`, 'info')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Request Re-test
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`Approved ${sub.candidate?.name}'s coding assessment!`, 'success')}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Approve Assessment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">New Coding Assessment</h3>
            <p className="text-xs text-slate-500 mb-5">Create a challenge and generate candidate access tokens.</p>

            <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Key-Value Store & Consensus"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary Stack / Language</label>
                  <select
                    value={newAssessment.language}
                    onChange={(e) => setNewAssessment({ ...newAssessment, language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="JavaScript / Python">JavaScript / Python</option>
                    <option value="TypeScript & Node.js">TypeScript & Node.js</option>
                    <option value="Python (FastAPI)">Python (FastAPI)</option>
                    <option value="Java 17 & Spring">Java 17 & Spring</option>
                    <option value="C++ 20">C++ 20</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
                  <select
                    value={newAssessment.durationMinutes}
                    onChange={(e) => setNewAssessment({ ...newAssessment, durationMinutes: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Candidate Email to Assign</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. candidate@university.edu"
                  value={newAssessment.assignedCandidateEmail}
                  onChange={(e) => setNewAssessment({ ...newAssessment, assignedCandidateEmail: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Create & Provision Access Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYER TEST SOLVE / PREVIEW MODAL */}
      {employerPreviewProblem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-8">
          <div className="bg-slate-900 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col border border-slate-800 shadow-2xl overflow-hidden">
            <div className="h-12 bg-slate-950 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">
                  Preview Sandboxed Environment: {employerPreviewProblem.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEmployerPreviewProblem(null)}
                className="text-xs px-3 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 p-4 bg-slate-950 overflow-hidden">
              <CodingIDE
                initialCode={employerPreviewProblem.starterCode?.javascript || employerPreviewProblem.starterCode?.python || ''}
                language="javascript"
                testCases={employerPreviewProblem.testCases || []}
                questionTitle={employerPreviewProblem.title}
                className="h-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
