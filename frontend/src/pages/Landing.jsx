import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Terminal, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  Video, 
  Code2, 
  LineChart, 
  Layers, 
  Mic, 
  Cpu, 
  ChevronRight,
  MonitorCheck,
  UserCheck,
  Building2,
  FileCheck2,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Landing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employer'); // 'employer' | 'candidate'

  return (
    <div className="flex-1 flex flex-col font-sans text-slate-900 bg-white">
      
      {/* ---------------------------------------------------- */}
      {/* 1. HERO SECTION & STRATEGIC BRAND INTRO */}
      {/* ---------------------------------------------------- */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 sm:px-12 lg:px-20 text-center select-none border-b border-slate-200">
        
        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>THOZHIL Unified Engineering Recruitment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            One Platform. <br />
            <span className="text-blue-600">
              Four Powerful Hiring Modules.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Consolidated AI Resume Screening, Conversational Voice & Video Interviews, Sandboxed Coding Assessments, and Automated Intern Code Audits in one unified platform.
          </p>
        </div>

        {/* ---------------------------------------------------- */}
        {/* 2. DUAL-PORTAL COMMAND GATEWAY (CANDIDATE & EMPLOYER) */}
        {/* ---------------------------------------------------- */}
        <div className="relative max-w-5xl mx-auto mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* PORTAL 1: CANDIDATE PORTAL */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                  <UserCheck className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                  Candidate Access
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  Candidate Portal
                </h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Enter your proctored assessment room, verify audio and camera hardware, and complete your technical evaluation with live coding benchmarks.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2.5 shrink-0" />
                  <span>Verified Hardware & Diagnostics</span>
                </div>
                <div className="flex items-center text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2.5 shrink-0" />
                  <span>Real-Time Voice & Sandbox Environment</span>
                </div>
                <div className="flex items-center text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2.5 shrink-0" />
                  <span>Direct Entry Without Account Creation</span>
                </div>
              </div>
            </div>

            <div className="pt-8 flex">
              <Button
                onClick={() => navigate('/candidate')}
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full justify-center"
              >
                Enter Candidate Portal
              </Button>
            </div>
          </div>

          {/* PORTAL 2: EMPLOYER & RECRUITER PORTAL */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                  <Building2 className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                  Employer Access
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Employer Portal
                </h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Design role assessment tracks, review comprehensive candidate reports, verify proctoring event timelines, and track recruitment velocity.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2.5 shrink-0" />
                  <span>Custom Question Bank & Assessment Tracks</span>
                </div>
                <div className="flex items-center text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2.5 shrink-0" />
                  <span>Dual Video & Screen Share Session Review</span>
                </div>
                <div className="flex items-center text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2.5 shrink-0" />
                  <span>Objective Multi-Skill Competency Dossiers</span>
                </div>
              </div>
            </div>

            <div className="pt-8 flex">
              <Button
                onClick={() => navigate('/recruiter')}
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full justify-center"
              >
                Enter Employer Portal
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. PLATFORM CAPABILITIES ARCHITECTURE */}
      {/* ---------------------------------------------------- */}
      <section className="py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto select-none">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full">
            Enterprise Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Built for Engineering Excellence</h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Eliminate subjective interviewing. Our standardized platform provides structured, reproducible assessments for every candidate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Capability 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-7 space-y-4 hover:border-slate-300 shadow-xs transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Interactive Voice Assessments</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Conduct high-fidelity conversational audio assessments with automated speech processing and precise response analysis calibrated to industry standards.
            </p>
            <div className="pt-2 text-xs font-semibold text-blue-700 flex items-center gap-1">
              <span>Low-latency audio processing</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Capability 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-7 space-y-4 hover:border-slate-300 shadow-xs transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Live Code Execution Sandbox</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluate real problem-solving capabilities with automated test runner suites, multi-language syntax support, and algorithmic complexity verification.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-700 flex items-center gap-1">
              <span>Full execution isolation & test cases</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Capability 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-7 space-y-4 hover:border-slate-300 shadow-xs transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Session Integrity Safeguards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict proctoring safeguards including tab switch limits, full screen lock enforcement, dual-feed webcam and screen capture, and shortcut restrictions.
            </p>
            <div className="pt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <span>Auditable session event logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. OBJECTIVE EVALUATION METRICS BENCHMARK */}
      {/* ---------------------------------------------------- */}
      <section className="bg-slate-900 text-white py-20 px-6 sm:px-12 lg:px-20 select-none relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-950 border border-blue-600/50 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
              <LineChart className="w-3.5 h-3.5 text-blue-400" />
              <span>Standardized Evaluation Scoring</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Actionable Candidate Reports Built on Measurable Competencies
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Every completed interview produces an objective report broken down across four core evaluation axes: Technical Accuracy, Communication, Problem Solving, and Session Fluency.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Axis 1</span>
                <h4 className="text-sm font-semibold text-white">Technical Accuracy</h4>
                <p className="text-[11px] text-slate-400">Syntax, algorithmic correctness, and architecture patterns.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Axis 2</span>
                <h4 className="text-sm font-semibold text-white">Problem Solving</h4>
                <p className="text-[11px] text-slate-400">Decomposition, boundary handling, and edge case resilience.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Axis 3</span>
                <h4 className="text-sm font-semibold text-white">Communication Depth</h4>
                <p className="text-[11px] text-slate-400">Clarity of thought, trade-off explanation, and articulation.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Axis 4</span>
                <h4 className="text-sm font-semibold text-white">Session Fluency</h4>
                <p className="text-[11px] text-slate-400">Hesitation metrics, speech fluency, and pace consistency.</p>
              </div>
            </div>
          </div>

          {/* Live Preview Scorecard Mockup */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-xs">
                  JD
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Candidate Assessment Report</h4>
                  <p className="text-xs text-slate-400">Senior Distributed Systems Engineer Track</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                RECOMMEND HIRE
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Technical Accuracy</span>
                  <span className="text-blue-400 font-bold">88%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[88%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">System Architecture</span>
                  <span className="text-indigo-400 font-bold">84%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[84%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Communication & Trade-offs</span>
                  <span className="text-cyan-400 font-bold">92%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full w-[92%]" />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-700 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-white text-[11px] uppercase tracking-wider">Session Audit Summary:</span>
              <p className="text-slate-400">
                0 tab-switches recorded. Continuous camera and screen sync verified. 100% session compliance.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. CALL TO ACTION STRIP */}
      {/* ---------------------------------------------------- */}
      <section className="py-20 px-6 sm:px-12 lg:px-20 text-center select-none relative">
        <div className="max-w-4xl mx-auto bg-slate-50 rounded-xl p-10 sm:p-14 border border-slate-200 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white text-blue-700 border border-slate-200 px-3.5 py-1 rounded-full text-xs font-semibold">
            <span>Direct Portal Entry</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Ready to Begin?</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Choose your portal below to access active assessments or configure your hiring workspace. Instant access without authentication gates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              onClick={() => navigate('/candidate')}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              Candidate Assessment Hub
            </Button>
            <Button
              onClick={() => navigate('/recruiter')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              Employer Workspace Hub
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
