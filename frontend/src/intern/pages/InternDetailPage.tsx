import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, FileText, Video, FolderKanban, Code2, CheckCircle, Save } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

export const InternDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [intern, setIntern] = useState<any>({
    internId: id || 'INT-901',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    role: 'Full Stack Engineer Candidate',
    scores: {
      resumeMatch: 94,
      interviewEvaluation: 88,
      projectAnalysis: 'Verified (Low Risk)',
      codingTestCasesPassed: '8/8 Passed'
    },
    decision: 'APPROVE',
    notes: 'Strong candidate across all technical and communication benchmarks.'
  });
  const [notesInput, setNotesInput] = useState(intern.notes);
  const [decisionInput, setDecisionInput] = useState(intern.decision);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/interns/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setIntern(data.data);
          setDecisionInput(data.data.decision || 'PENDING_REVIEW');
          setNotesInput(data.data.notes || '');
        }
      })
      .catch(() => {});
  }, [id]);

  const saveDecision = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/interns/${id || 'INT-901'}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decisionInput, notes: notesInput })
      });
      const data = await res.json();
      if (data.success) {
        setIntern((prev: any) => ({ ...prev, decision: decisionInput, notes: notesInput }));
      }
    } catch (err) {
      setIntern((prev: any) => ({ ...prev, decision: decisionInput, notes: notesInput }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-2 md:p-4 max-w-7xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate('/interns')}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Intern Directory
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span>Intern Record: {intern.internId}</span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Candidate Profile
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-module assessment profile orchestrated under Thozhil Platform.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intern Overview Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg shadow-blue-500/20">
            {intern.name.substring(0, 2).toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{intern.name}</h2>
          <p className="text-xs text-blue-600 font-mono mb-4">{intern.role}</p>
          
          <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{intern.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Status: <strong className="text-slate-900">Evaluated Across 4 Modules</strong></span>
            </div>
          </div>
        </div>

        {/* Modular Assessment Scores */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Cross-Module Candidate Score Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">AI Resume Screener</p>
                  <p className="text-[11px] text-slate-500">Parsing & Keyword Fit</p>
                </div>
              </div>
              <span className="text-base font-bold font-mono text-slate-900">{intern.scores.resumeMatch}%</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">AI Video Interviewer</p>
                  <p className="text-[11px] text-slate-500">Communication & Depth</p>
                </div>
              </div>
              <span className="text-base font-bold font-mono text-slate-900">{intern.scores.interviewEvaluation}/100</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderKanban className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">AI Project Analyser</p>
                  <p className="text-[11px] text-slate-500">Repository Review</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-900">{intern.scores.projectAnalysis}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">AI Coding Interviewer</p>
                  <p className="text-[11px] text-slate-500">Monaco Execution</p>
                </div>
              </div>
              <span className="text-base font-bold font-mono text-slate-900">{intern.scores.codingTestCasesPassed}</span>
            </div>
          </div>

          {/* Hiring Authority Decision Control */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hiring Decision & Evaluator Notes</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Decision Status</label>
                <select
                  value={decisionInput}
                  onChange={(e) => setDecisionInput(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="APPROVE">APPROVE — Accept Candidate</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW — Under Discussion</option>
                  <option value="REJECT">REJECT — Disqualify Candidate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Manager Evaluation Notes</label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="Enter decision rationale or feedback..."
                />
              </div>
            </div>

            <button
              onClick={saveDecision}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Decision...' : 'Save Decision Record'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};
