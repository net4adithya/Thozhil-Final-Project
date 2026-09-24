import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Video,
  CheckCircle2,
  TrendingUp,
  Plus,
  ChevronRight,
  UserPlus,
  ArrowRight,
  Award,
  Clock,
  Briefcase,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { BrandLoader } from '../components/common/BrandLoader';
import { EmptyState } from '../components/ui/EmptyState';

export const RecruiterDashboard = () => {
  const { analytics, candidates, interviews, loading } = useApp();
  const navigate = useNavigate();
  const [candidateFilter, setCandidateFilter] = useState('');

  if (loading) {
    return (
      <BrandLoader 
        message="Loading Recruiter Workspace..." 
        subMessage="Fetching candidate assessments and pipeline metrics"
        fullScreen={true} 
      />
    );
  }

  const candList = candidates || [];
  const intList = interviews || [];

  const evaluatedCandidates = candList.filter(c => c.status === 'Completed' || c.status === 'Evaluated' || c.overall_score !== undefined || c.overallScore !== undefined);
  const inProgressCandidates = candList.filter(c => c.status === 'In Progress' || c.status === 'Reviewing');
  const invitedCandidates = candList.filter(c => c.status === 'Invited' || (!c.status && !evaluatedCandidates.includes(c)));

  const computedAvgScore = evaluatedCandidates.length > 0 
    ? Math.round(evaluatedCandidates.reduce((acc, c) => acc + Number(c.overall_score ?? c.overallScore ?? 0), 0) / evaluatedCandidates.length)
    : 0;

  const kpis = analytics?.kpis || {
    activeInterviews: intList.filter(i => i.status === 'Active').length || intList.length,
    totalInvited: candList.length,
    completions: evaluatedCandidates.length,
    averageScore: computedAvgScore,
    conversionRate: candList.length > 0 ? Math.round((evaluatedCandidates.length / candList.length) * 100) : 0
  };

  const recommendedCandidates = evaluatedCandidates.filter(c => {
    const score = c.overall_score ?? c.overallScore ?? 0;
    const rec = (c.recommendation || '').toUpperCase().trim();
    if (rec.includes('DO NOT HIRE') || rec.includes('NO HIRE') || rec.includes('NOT HIRE') || rec.includes('REJECT') || score < 55) {
      return false;
    }
    return (rec === 'HIRE' || (rec.includes('HIRE') && !rec.includes('NOT') && !rec.includes('NO')) || score >= 70);
  });

  const priorityCandidates = [...evaluatedCandidates, ...inProgressCandidates].filter(c => {
    if (!candidateFilter) return true;
    const q = candidateFilter.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.role || '').toLowerCase().includes(q);
  }).slice(0, 6);

  const avgScore = kpis.averageScore || computedAvgScore;

  const pipelineStages = [
    { 
      id: 'INVITED', 
      label: 'Invited', 
      count: invitedCandidates.length,
      desc: 'Pending candidate start',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      trackColor: 'bg-blue-600'
    },
    { 
      id: 'IN_PROGRESS', 
      label: 'In Assessment', 
      count: inProgressCandidates.length,
      desc: 'Active assessment session',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      trackColor: 'bg-amber-500'
    },
    { 
      id: 'EVALUATED', 
      label: 'Evaluated', 
      count: evaluatedCandidates.length,
      desc: 'Scored against technical rubric',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      trackColor: 'bg-slate-600'
    },
    { 
      id: 'RECOMMENDED', 
      label: 'Recommended', 
      count: recommendedCandidates.length,
      desc: 'Qualified technical match',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      trackColor: 'bg-emerald-600'
    },
  ];

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900">
      
      {/* 1. Clean Executive Operations Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Recruitment Overview
            </h1>
            <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Monitor active technical assessments, candidate progression pipelines, and evaluated dossiers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <Button
            onClick={() => navigate('/recruiter/candidates?invite=true')}
            size="sm"
            variant="secondary"
            icon={UserPlus}
          >
            Invite Candidate
          </Button>
          <Button
            onClick={() => navigate('/recruiter/interviews/new')}
            size="sm"
            variant="primary"
            icon={Plus}
          >
            Create Assessment
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Assessments</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {kpis.activeInterviews || intList.length || 0}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Configured roles</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Candidates</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {candList.length}
              </span>
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Pipeline
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Registered applicants</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Evaluated Dossiers</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {evaluatedCandidates.length}
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Completed reviews</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Score</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">
                {avgScore > 0 ? `${avgScore}%` : '—'}
              </span>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                Benchmark
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Technical benchmark</p>
          </div>
        </div>
      </div>

      {/* 3. Candidate Pipeline Progression */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Candidate Pipeline Stages</h2>
            <p className="text-xs text-slate-500">Overview of candidate volume across assessment phases</p>
          </div>

          <button
            onClick={() => navigate('/recruiter/candidates')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Candidate Directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pipelineStages.map((stage) => {
            const percentage = candList.length > 0 ? Math.round((stage.count / candList.length) * 100) : 0;
            return (
              <div
                key={stage.id}
                onClick={() => navigate('/recruiter/candidates')}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    {stage.label}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${stage.badgeColor}`}>
                    {percentage}%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-bold text-slate-900">{stage.count}</span>
                    <span className="text-xs text-slate-500">candidates</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{stage.desc}</span>
                </div>

                {/* Progress Track */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stage.trackColor} transition-all duration-300`}
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Actionable Two-Column Split: Needs Review & Active Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Candidates Requiring Review */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Candidate Activity</h2>
              <span className="text-xs text-slate-500">Recent submissions and assessments in progress</span>
            </div>

            {/* Filter */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by name or role..."
                value={candidateFilter}
                onChange={(e) => setCandidateFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-grow">
            {priorityCandidates.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title={candidateFilter ? "No candidates match filter" : "No candidate submissions yet"}
                  description={candidateFilter ? "Try clearing your search query." : "When invited candidates complete their assessments, their evaluated dossiers will appear here for review."}
                  actionLabel="Invite Candidate"
                  onAction={() => navigate('/recruiter/candidates?invite=true')}
                />
              </div>
            ) : (
              priorityCandidates.map((cand) => {
                const score = cand.overall_score ?? cand.overallScore;
                const isEvaluated = score !== undefined && score !== null;

                return (
                  <div 
                    key={cand.id} 
                    className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <Avatar name={cand.name} size="sm" />

                      <div className="flex flex-col min-w-0 text-left">
                        <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {cand.name}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate mt-0.5">
                          {cand.role || 'Software Engineer'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0">
                      {isEvaluated ? (
                        <>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 block">
                              {score}%
                            </span>
                            <span className="text-[10px] text-slate-400 block capitalize">
                              {cand.recommendation ? cand.recommendation.replace('_', ' ').toLowerCase() : 'evaluated'}
                            </span>
                          </div>

                          <Button
                            onClick={() => navigate(`/recruiter/candidates/${cand.id}/report`)}
                            size="xs"
                            variant="secondary"
                            icon={ArrowUpRight}
                            iconPosition="right"
                          >
                            Report
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium px-2 py-0.5 rounded">
                            In Progress
                          </span>
                          <Button
                            onClick={() => navigate('/recruiter/candidates')}
                            size="xs"
                            variant="outline"
                          >
                            Profile
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {priorityCandidates.length} of {candList.length} candidates</span>
            <button
              onClick={() => navigate('/recruiter/candidates')}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              <span>View all candidates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Active Assessment Tracks */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Active Assessments</h2>
              <span className="text-xs text-slate-500">{intList.length} assessment tracks</span>
            </div>

            <button
              onClick={() => navigate('/recruiter/interviews')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-grow">
            {intList.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  title="No active assessments"
                  description="Create an assessment position to begin evaluating technical candidates."
                  actionLabel="Create Assessment"
                  onAction={() => navigate('/recruiter/interviews/new')}
                />
              </div>
            ) : (
              intList.slice(0, 5).map((item) => {
                const assignedCount = candList.filter(c => c.interviewId === item.id || c.interview_id === item.id).length;

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/recruiter/interviews/${item.id}`)}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 truncate block group-hover:text-blue-600 transition-colors">
                        {item.title || item.jobRole}
                      </span>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{item.department || 'Engineering'}</span>
                        <span>•</span>
                        <span>{item.duration || 30} mins</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {assignedCount} candidates
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <Button
              onClick={() => navigate('/recruiter/interviews/new')}
              size="xs"
              variant="outline"
              icon={Plus}
              className="w-full"
            >
              Create New Assessment
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default RecruiterDashboard;
