import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, ChevronRight, Code2, Video, FileText, FolderKanban, UserCheck, ShieldCheck, Award, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/InternContext';
import { DashboardLayout } from '../components/DashboardLayout';

interface Intern {
  internId: string;
  name: string;
  email: string;
  role: string;
  scores: {
    resumeMatch?: number;
    interviewEvaluation?: number;
    projectAnalysis?: string;
    codingTestCasesPassed?: string;
  };
  decision: string;
}

export const InternsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useApp();
  
  const [interns, setInterns] = useState<Intern[]>([
    {
      internId: 'INT-901',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      role: 'Full Stack Engineer Intern',
      scores: {
        resumeMatch: 94,
        interviewEvaluation: 88,
        projectAnalysis: 'Verified (Low Risk)',
        codingTestCasesPassed: '8/8 Passed'
      },
      decision: 'APPROVE'
    },
    {
      internId: 'INT-902',
      name: 'Arjun Patel',
      email: 'arjun.patel@example.com',
      role: 'Backend Systems Intern',
      scores: {
        resumeMatch: 89,
        interviewEvaluation: 84,
        projectAnalysis: 'Verified (Low Risk)',
        codingTestCasesPassed: '7/8 Passed'
      },
      decision: 'PENDING_REVIEW'
    },
    {
      internId: 'INT-903',
      name: 'Rohan Das',
      email: 'rohan.das@example.com',
      role: 'AI / ML Engineer Intern',
      scores: {
        resumeMatch: 96,
        interviewEvaluation: 92,
        projectAnalysis: 'Verified (Zero Risk)',
        codingTestCasesPassed: '8/8 Passed'
      },
      decision: 'APPROVE'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/interns')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setInterns(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Dedicated Intern Personal Profile View (Strictly single candidate, no access to directory of others)
  if (role === 'intern') {
    const activeIdentity = (localStorage.getItem('thozhil_intern_identity') || '').toLowerCase();
    // Match logged-in intern or default to INT-901
    const myProfile = interns.find(i => 
      i.internId.toLowerCase() === activeIdentity ||
      i.email.toLowerCase().includes(activeIdentity) ||
      i.name.toLowerCase().includes(activeIdentity)
    ) || interns[0];

    return (
      <DashboardLayout>
        <div className="p-2 md:p-4 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-blue-600" />
              My Intern Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Personal assessment records, verified track status, and evaluation summaries.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 font-mono">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Active Authorized Track</span>
          </div>
        </div>

        {/* Primary Identity Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              {myProfile.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{myProfile.name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{myProfile.email} • ID: <strong className="text-slate-800">{myProfile.internId}</strong></p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                <Award size={14} className="text-blue-600" />
                <span>{myProfile.role}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Track Evaluation Status</span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono ${
              myProfile.decision === 'APPROVE'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {myProfile.decision}
            </span>
          </div>
        </div>

        {/* Evaluation Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Resume Match</span>
              <FileText size={18} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{myProfile.scores.resumeMatch}%</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified Technical Match</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Video Evaluation</span>
              <Video size={18} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{myProfile.scores.interviewEvaluation}/100</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1">Communication Score</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Project Analysis</span>
              <FolderKanban size={18} className="text-purple-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">{myProfile.scores.projectAnalysis}</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Log & Work Verification</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Coding Assessment</span>
              <Code2 size={18} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{myProfile.scores.codingTestCasesPassed}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Monaco AST Test Cases</div>
          </div>
        </div>
        </div>
      </DashboardLayout>
    );
  }

  // Admin Directory View
  const filteredInterns = interns.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.internId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-2 md:p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            Intern Details Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Orchestrated candidate records across AI Resume, Video Interview, Project Analysis, and Coding assessments.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-md bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filteredInterns.length}</span> candidates
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterns.map((intern) => (
          <div 
            key={intern.internId}
            onClick={() => navigate(`/interns/${intern.internId}`)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center border border-blue-100">
                    {intern.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{intern.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{intern.internId}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                  intern.decision === 'APPROVE' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {intern.decision}
                </span>
              </div>

              <div className="space-y-2 py-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><FileText className="w-3.5 h-3.5 text-blue-500" /> Resume Score</span>
                  <span className="font-semibold text-slate-800 font-mono">{intern.scores.resumeMatch}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><Video className="w-3.5 h-3.5 text-indigo-500" /> Video Evaluation</span>
                  <span className="font-semibold text-slate-800 font-mono">{intern.scores.interviewEvaluation}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><FolderKanban className="w-3.5 h-3.5 text-purple-500" /> Project Analysis</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{intern.scores.projectAnalysis}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><Code2 className="w-3.5 h-3.5 text-emerald-500" /> Coding Test</span>
                  <span className="font-semibold text-slate-800 font-mono">{intern.scores.codingTestCasesPassed}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>View Candidate Audit</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
};
