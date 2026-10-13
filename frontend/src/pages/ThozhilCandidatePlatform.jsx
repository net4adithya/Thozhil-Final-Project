import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Video,
  FileCheck2,
  Code2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Clock,
  Terminal,
  Play
} from 'lucide-react';
import { useThozhilAuth } from '../context/ThozhilAuthContext';
import { Button } from '../components/ui/Button';

export const ThozhilCandidatePlatform = () => {
  const { user } = useThozhilAuth();
  const navigate = useNavigate();

  const candidateModules = [
    {
      id: 'm1',
      badge: 'MODULE 1 • LOGLENSE',
      title: 'Submit Daily Work Log & Code Audit',
      folder: 'main/intern',
      desc: 'Submit your internship task deliverables and program files. Receive automated line-level code feedback, quality scores, and TTS speech synthesis summaries.',
      route: '/candidate/loglense',
      icon: FileText,
      themeColor: 'blue',
      features: ['Paste or upload code deliverables', 'Line-level automated feedback', 'Text-to-Speech audio explanation']
    },
    {
      id: 'm2',
      badge: 'MODULE 2 • INTERVIEWX AI',
      title: 'AI Conversational Video & Voice Interview',
      folder: 'project-a',
      desc: 'Enter your proctored interview room with live conversational Sarvam AI speech loop, camera diagnostics, and proctoring event monitoring.',
      route: '/candidate/interviewx',
      icon: Video,
      themeColor: 'indigo',
      features: ['Real-time adaptive voice dialogue', 'Hardware device & camera check', 'Dual video & audio streaming']
    },
    {
      id: 'm3',
      badge: 'MODULE 3 • RESUME SCREENER',
      title: 'Resume Qualification & Skill Match Analysis',
      folder: 'project-b',
      desc: 'Upload your latest resume (PDF/DOCX) against target engineering job specifications. View your semantic skill match score, identified strengths, and gaps.',
      route: '/candidate/resume-check',
      icon: FileCheck2,
      themeColor: 'emerald',
      features: ['Instant resume structure extraction', 'Semantic role requirement match %', 'Detailed strengths & gaps scorecard']
    },
    {
      id: 'm4',
      badge: 'MODULE 4 • CODING ASSESSMENTS',
      title: 'Sandboxed Monaco Coding Challenge IDE',
      folder: 'project-d',
      desc: 'Complete technical coding challenges inside an in-browser Monaco IDE. Compile and execute against test cases in an isolated, secure Docker container.',
      route: '/candidate/coding-workspace',
      icon: Code2,
      themeColor: 'amber',
      features: ['Multi-language support (Python, JS, C++)', 'Hardened Docker container sandbox', 'Real-time test suite runner']
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-left">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Thozhil Candidate & Intern Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Candidate Assessment Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Welcome, <strong className="text-slate-800">{user?.name || 'Candidate'}</strong>. Your evaluation pipeline is ready. Choose an assigned module below to start your interview, verify your resume match, or complete coding benchmarks.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Candidate Identity Verified</span>
        </div>
      </div>

      {/* 4 Candidate Modules Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Assigned Candidate Modules
          </h2>
          <p className="text-xs text-slate-500">
            Select an assessment or review module to begin your technical evaluation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidateModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-blue-400/50 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-mono border border-blue-100">
                      {mod.badge}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Ready to Start</span>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Included Capabilities:
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {mod.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center text-xs text-slate-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(mod.route)}
                    className="shadow-xs"
                  >
                    <span>Launch Module</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
