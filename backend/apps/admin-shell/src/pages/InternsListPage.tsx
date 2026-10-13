import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Search, ChevronRight, Code, Video, FileText, FolderKanban } from '../components/Icons';

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
      .catch(() => {
        // Fallback to default list if gateway API is offline
      });
  }, []);

  const filteredInterns = interns.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.internId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Intern Details Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Orchestrated candidate records across AI Resume, Video Interview, Project Analysis, and Coding assessments.
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-slate-800 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-md bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search intern name, ID, or email..."
            className="bg-transparent border-0 text-xs text-slate-200 focus:outline-none w-full"
          />
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Intern ID & Name</th>
              <th className="p-4">Applied Role</th>
              <th className="p-4">Resume Screening</th>
              <th className="p-4">Video Interview</th>
              <th className="p-4">Coding Assessment</th>
              <th className="p-4">Admin Decision</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
            {filteredInterns.map((intern) => (
              <tr key={intern.internId} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-100">{intern.name}</div>
                  <div className="text-[11px] font-mono text-indigo-400">{intern.internId} • {intern.email}</div>
                </td>
                <td className="p-4 text-slate-300">{intern.role}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    <FileText className="w-3 h-3" />
                    {intern.scores?.resumeMatch ? `${intern.scores.resumeMatch}% Match` : 'Screened'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                    <Video className="w-3 h-3" />
                    {intern.scores?.interviewEvaluation ? `${intern.scores.interviewEvaluation}% Eval` : 'Completed'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    <Code className="w-3 h-3" />
                    {intern.scores?.codingTestCasesPassed || 'Passed'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border ${
                    intern.decision === 'APPROVE' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : intern.decision === 'REJECT'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {intern.decision}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <NavLink
                    to={`/interns/${intern.internId}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                  >
                    <span>View Record</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </NavLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
