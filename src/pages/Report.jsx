import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Play,
  Volume2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('video');

  useEffect(() => {
    setActiveMediaTab('video');
    setPlayingVideo(false);
  }, [activeQuestionIdx]);

  useEffect(() => {
    if (!loading && candidates.length > 0) {
      const match = candidates.find((c) => c.id === id);
      if (match) {
        setCandidate(match);
        const matchInt = interviews.find((i) => i.id === match.interviewId);
        setInterview(matchInt);
      } else {
        navigate('/recruiter/candidates');
      }
    }
  }, [id, candidates, interviews, loading, navigate]);

  if (loading || !candidate) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const skillsData = candidate.skills || [];
  const timelineData = candidate.timeline || [];
  const currentTimelineItem = timelineData[activeQuestionIdx];
  const activeQuestion = interview ? interview.questions.find(q => q.id === currentTimelineItem?.questionId) : null;
  const activeTranscript = candidate.transcripts[currentTimelineItem?.questionId] || "No recording transcript matches this question.";

  const getRecommendationBadge = (rec) => {
    if (rec === 'STRONG HIRE') return <Badge variant="success">Strong Hire</Badge>;
    if (rec === 'HIRE') return <Badge variant="primary">Hire</Badge>;
    if (rec === 'HIRE WITH RESERVATIONS') return <Badge variant="warning">Hire with Reservations</Badge>;
    return <Badge variant="danger">Do Not Hire</Badge>;
  };

  const breadcrumbs = [
    { label: 'Workspace', path: '/recruiter' },
    { label: 'Candidates', path: '/recruiter/candidates' },
    { label: `${candidate.name} Evaluation` }
  ];

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Back button & Breadcrumb */}
      <div className="flex flex-col space-y-2 select-none text-left">
        <button
          onClick={() => navigate('/recruiter/candidates')}
          className="inline-flex items-center text-xs font-semibold text-brandBody hover:text-brandHeading space-x-1 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to candidates list</span>
        </button>
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none text-left">
        <div className="flex items-center space-x-3.5">
          <Avatar name={candidate.name} size="lg" />
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-brandHeading leading-tight">{candidate.name}</h1>
              {getRecommendationBadge(candidate.recommendation)}
            </div>
            <p className="text-xs text-brandBody mt-0.5">Applied to: <span className="font-semibold">{candidate.role}</span> • Reviewed on {candidate.completionDate}</p>
          </div>
        </div>
      </div>

      {/* Overview stats: score, radar chart, AI summary, proctor index */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none text-left">
        {/* Overall score gauge card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Match Rating</h3>
          </CardHeader>
          <CardBody className="flex flex-col items-center justify-center py-6 flex-grow">
            <div className="relative flex items-center justify-center">
              {/* SVG Ring Progress */}
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="64" stroke="#E5E7EB" strokeWidth="8" fill="transparent" />
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  stroke="#2563EB"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={402}
                  strokeDashoffset={402 - (402 * candidate.overallScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-brandHeading tracking-tight">{candidate.overallScore}%</span>
                <span className="text-[10px] uppercase font-bold tracking-wide text-brandBody">Fit score</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recharts radar chart card */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Skill Vector Analysis</h3>
          </CardHeader>
          <CardBody className="h-56 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" r="80%" data={skillsData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="name" stroke="#6B7280" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#D1D5DB" tick={false} />
                <Radar name="Candidate" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Proctoring integrity audit card */}
        <Card className="flex flex-col">
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Proctor Integrity Audit</h3>
          </CardHeader>
          <CardBody className="p-4 flex-grow flex flex-col justify-between space-y-4">
            {(() => {
              const proctorLog = candidate.codeAnswers?.proctor || { tabSwitches: 0, copyPastes: 0, screenShareActive: true };
              const calculateIntegrityScore = () => {
                let base = 100;
                base -= (proctorLog.tabSwitches || 0) * 15;
                base -= (proctorLog.copyPastes || 0) * 20;
                return Math.max(10, base);
              };
              const integrityScore = calculateIntegrityScore();
              
              return (
                <>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-brandBody block">Trust Score Index</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-extrabold ${
                        integrityScore >= 80 ? 'text-brandSuccess' : integrityScore >= 50 ? 'text-brandWarning' : 'text-brandDanger'
                      }`}>
                        {integrityScore}%
                      </span>
                      <span className="text-[10px] text-brandBody font-semibold uppercase">
                        {integrityScore >= 80 ? 'Verified Trust' : integrityScore >= 50 ? 'Needs Attention' : 'Suspicious Exam'}
                      </span>
                    </div>
                    {/* Linear progress bar */}
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full rounded-full ${
                          integrityScore >= 80 ? 'bg-brandSuccess' : integrityScore >= 50 ? 'bg-brandWarning' : 'bg-brandDanger'
                        }`}
                        style={{ width: `${integrityScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px] font-mono text-brandHeading border-t border-brandBorder pt-3">
                    <div className="flex justify-between items-center">
                      <span>Tab Switches:</span>
                      <span className={proctorLog.tabSwitches > 0 ? 'text-brandWarning font-bold' : 'text-brandSuccess font-bold'}>
                        {proctorLog.tabSwitches}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Copy/Pastes:</span>
                      <span className={proctorLog.copyPastes > 0 ? 'text-brandDanger font-bold' : 'text-brandSuccess font-bold'}>
                        {proctorLog.copyPastes}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Screen Share:</span>
                      <span className="text-brandSuccess font-bold">Active</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardBody>
        </Card>

        {/* AI Recommendations card */}
        <Card className="flex flex-col">
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Executive Summary</h3>
          </CardHeader>
          <CardBody className="text-xs text-brandBody leading-relaxed flex-grow overflow-y-auto max-h-56">
            {candidate.summary}
          </CardBody>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none text-left">
        <Card className="border-green-100 bg-green-50/10">
          <CardHeader className="border-green-150">
            <h3 className="text-sm font-bold text-brandHeading flex items-center space-x-1.5 text-brandSuccess">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>Core Strengths</span>
            </h3>
          </CardHeader>
          <CardBody className="p-4">
            <ul className="space-y-2.5 text-xs text-brandBody">
              {candidate.strengths?.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brandSuccess font-bold shrink-0 mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="border-amber-100 bg-amber-50/10">
          <CardHeader className="border-amber-150">
            <h3 className="text-sm font-bold text-brandHeading flex items-center space-x-1.5 text-brandWarning">
              <AlertTriangle className="w-4.5 h-4.5" />
              <span>Identified Gaps</span>
            </h3>
          </CardHeader>
          <CardBody className="p-4">
            <ul className="space-y-2.5 text-xs text-brandBody">
              {candidate.weaknesses?.map((weak, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brandWarning font-bold shrink-0 mt-0.5">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Question timeline review split console */}
      <div className="flex-grow flex flex-col space-y-3.5 text-left">
        <h3 className="text-base font-bold text-brandHeading">Detailed Question Playback</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-start">

          {/* Question selector timeline pane */}
          <div className="lg:col-span-1 space-y-3 select-none">
            {timelineData.map((item, idx) => {
              const q = interview ? interview.questions.find((qi) => qi.id === item.questionId) : null;
              const isActive = idx === activeQuestionIdx;

              return (
                <button
                  key={item.questionId}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`w-full text-left p-4 border rounded-xl transition-all duration-200 flex items-start space-x-3 bg-white ${isActive
                    ? 'border-primary ring-2 ring-primary/10 shadow-sm'
                    : 'border-brandBorder hover:border-gray-300'
                    }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-brandHeading'
                    }`}>
                    {idx + 1}
                  </span>

                  <div className="space-y-1.5 text-left overflow-hidden flex-grow">
                    <span className="text-xs font-bold text-brandHeading block truncate">
                      {q ? q.text : 'Evaluation Prompt'}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-brandBody">
                      <span>Score: <span className="font-semibold text-brandHeading">{item.score}%</span></span>
                      <span>Time: {item.timeTaken}s</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Question review output */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex justify-between items-center bg-gray-50/50">
              <span className="text-xs font-semibold text-brandBody">
                Question {activeQuestionIdx + 1} of {timelineData.length}
              </span>
              <Badge variant="primary">{activeQuestion?.category || 'React'}</Badge>
            </CardHeader>
            <CardBody className="p-6 space-y-6">

              {/* Question Text */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brandBody">Evaluation Question</span>
                <p className="text-sm font-bold text-brandHeading leading-relaxed">{activeQuestion?.text}</p>
              </div>

              {/* Tab Selector if category is Coding */}
              {activeQuestion?.category === 'Coding' && (
                <div className="flex border-b border-brandBorder mb-4 select-none">
                  <button
                    onClick={() => { setActiveMediaTab('video'); setPlayingVideo(false); }}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                      activeMediaTab === 'video' ? 'border-primary text-primary' : 'border-transparent text-brandBody hover:text-brandHeading'
                    }`}
                  >
                    Video Response
                  </button>
                  <button
                    onClick={() => { setActiveMediaTab('code'); setPlayingVideo(false); }}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                      activeMediaTab === 'code' ? 'border-primary text-primary' : 'border-transparent text-brandBody hover:text-brandHeading'
                    }`}
                  >
                    Code Submission
                  </button>
                </div>
              )}

              {/* Video Response Panel / Code Submission Panel */}
              {activeMediaTab === 'code' ? (
                (() => {
                  const codeAns = candidate.codeAnswers?.[activeQuestion.id];
                  if (!codeAns) {
                    return (
                      <div className="aspect-video bg-slate-950 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-xs text-slate-500 font-mono p-10">
                        No code submission record found for this question.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-5 text-left">
                      {/* Code Terminal */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 font-mono text-[11px] text-slate-200 text-left overflow-x-auto select-all max-h-72 overflow-y-auto">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-850 pb-2.5 mb-3.5 select-none font-sans font-bold">
                          <span>language: {codeAns.language || 'javascript'}</span>
                          <span className={`px-2.5 py-0.5 rounded font-extrabold uppercase ${
                            codeAns.status === 'Accepted' ? 'bg-brandSuccess/20 text-brandSuccess' : 'bg-brandDanger/20 text-brandDanger'
                          }`}>
                            {codeAns.status || 'Submitted'}
                          </span>
                        </div>
                        <pre className="whitespace-pre">{codeAns.code}</pre>
                      </div>

                      {/* Test cases outcomes */}
                      {codeAns.testCasesResult && codeAns.testCasesResult.length > 0 && (
                        <div className="space-y-3 text-left">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-brandBody block">Sandbox Test Cases Outcomes</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 select-none">
                            {codeAns.testCasesResult.map((res, index) => (
                              <div key={index} className="bg-gray-50 border border-brandBorder rounded-xl p-4 flex flex-col justify-between">
                                <div className="text-[10px] text-brandBody font-mono space-y-1">
                                  <div>Input: <span className="text-brandHeading font-semibold">{res.input}</span></div>
                                  <div>Expected: <span className="text-brandHeading font-semibold">{res.expected}</span></div>
                                  {res.actual && <div>Actual: <span className="text-brandHeading font-semibold">{res.actual}</span></div>}
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-brandBorder">
                                  <span className="text-[9px] uppercase font-bold text-brandBody">Case {index + 1}</span>
                                  <span className={`text-[10px] font-extrabold uppercase ${
                                    res.passed ? 'text-brandSuccess' : 'text-brandDanger'
                                  }`}>
                                    {res.passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Video preview / recording block */
                <div className="aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                  {playingVideo ? (
                    // Mock loop playback video
                    <div className="w-full h-full flex items-center justify-center relative select-none">
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-white">
                        <Volume2 className="w-12 h-12 text-primary animate-pulse mb-3" />
                        <span className="text-sm font-semibold">Playing candidate video capture...</span>
                        <span className="text-xs text-gray-500 mt-1">Audio active • 0:14 / 1:20</span>
                      </div>
                      <button
                        onClick={() => setPlayingVideo(false)}
                        className="absolute bottom-4 right-4 text-xs font-semibold bg-white text-slate-900 px-3 py-1.5 rounded-lg border hover:bg-gray-100"
                      >
                        Stop
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3.5 select-none">
                      <div className="p-4 bg-white/5 backdrop-blur-md rounded-full text-white cursor-pointer hover:scale-105 transition-all shadow border border-white/10" onClick={() => setPlayingVideo(true)}>
                        <Play className="w-6 h-6 fill-current text-white translate-x-0.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">Play Candidate Response Video</span>
                    </div>
                  )}
                </div>
              )}

              {/* AI Transcript output */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brandBody">Speech-to-Text Transcript</span>
                <div className="bg-gray-50 border border-brandBorder p-4 rounded-xl text-xs text-brandHeading leading-relaxed italic max-h-40 overflow-y-auto">
                  "{activeTranscript}"
                </div>
              </div>

              {/* Evaluator comments */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brandBody">System Assessment Telemetry</span>
                <div className="flex items-start space-x-2 bg-blue-50/20 border border-primary/20 p-4 rounded-xl text-xs text-brandHeading leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{currentTimelineItem?.comments}</span>
                </div>
              </div>

            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
};
