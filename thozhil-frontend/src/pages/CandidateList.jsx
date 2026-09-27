import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  UserPlus, 
  Search, 
  ChevronRight, 
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { BrandLoader } from '../components/common/BrandLoader';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

export const CandidateList = () => {
  const { candidates, interviews, inviteCandidate, loading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'Completed' | 'Reviewing' | 'Invited'
  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Read URL query parameters to auto-launch invitation if requested
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('invite') === 'true') {
      setInviteModalOpen(true);
    }
  }, [location]);

  if (loading) {
    return (
      <BrandLoader 
        message="Loading Candidate Directory..." 
        subtext="Fetching candidate records and assessment statuses"
        fullScreen={true} 
      />
    );
  }

  const filteredCandidates = (candidates || []).filter((cand) => {
    const isCompleted = cand.status === 'Completed' || cand.status === 'Evaluated' || cand.overall_score || cand.overallScore;
    const isReviewing = cand.status === 'Reviewing' || cand.status === 'In Progress';
    const isInvited = cand.status === 'Invited' || (!cand.status && !isCompleted && !isReviewing);

    let statusMatch = true;
    if (filter === 'Completed') statusMatch = isCompleted;
    if (filter === 'Reviewing') statusMatch = isReviewing;
    if (filter === 'Invited') statusMatch = isInvited;

    const searchMatch = !search.trim() ||
      cand.name?.toLowerCase().includes(search.toLowerCase()) ||
      cand.email?.toLowerCase().includes(search.toLowerCase()) ||
      cand.role?.toLowerCase().includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  const getStatusBadge = (cand) => {
    const score = cand.overall_score ?? cand.overallScore;
    if (cand.status === 'Completed' || cand.status === 'Evaluated' || score !== undefined) {
      return (
        <Badge variant="success" size="xs" dot={true}>
          Evaluated
        </Badge>
      );
    }
    if (cand.status === 'Reviewing' || cand.status === 'In Progress') {
      return (
        <Badge variant="warning" size="xs" dot={true}>
          In Progress
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" size="xs">
        Invited
      </Badge>
    );
  };

  const getRecommendationBadge = (rec, score) => {
    if (!rec && score === undefined) return <span className="text-slate-400">—</span>;
    const r = (rec || '').toUpperCase().trim();

    if (
      r.includes('DO NOT HIRE') || 
      r.includes('NO HIRE') || 
      r.includes('NOT HIRE') || 
      r.includes('REJECT') || 
      (score !== undefined && score !== null && score < 55)
    ) {
      return <Badge variant="danger" size="xs">Do Not Hire</Badge>;
    }

    if (r.includes('STRONG HIRE') || (score >= 85 && !r.includes('RESERVATION'))) {
      return <Badge variant="success" size="xs">Strong Hire</Badge>;
    }

    if (r.includes('RESERVATION') || (score >= 55 && score < 70)) {
      return <Badge variant="warning" size="xs">Review Required</Badge>;
    }

    if (r === 'HIRE' || (r.includes('HIRE') && !r.includes('NOT') && !r.includes('NO')) || score >= 70) {
      return <Badge variant="success" size="xs">Hire</Badge>;
    }

    return <Badge variant="danger" size="xs">Do Not Hire</Badge>;
  };

  const handleInviteSubmit = async (data) => {
    try {
      setSubmitting(true);
      const selectedInt = (interviews || []).find((i) => i.id === data.interviewId);
      await inviteCandidate({
        name: data.name,
        email: data.email,
        role: selectedInt ? (selectedInt.jobRole || selectedInt.title) : 'Software Engineer',
        interviewId: data.interviewId
      });
      setInviteModalOpen(false);
      reset();
      navigate('/recruiter/candidates', { replace: true });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const activeInterviews = (interviews || []).filter(i => i.status === 'Active' || !i.status);

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Candidates</h1>
            <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {candidates?.length || 0} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review candidate profiles, assessment status, overall performance scores, and evaluation reports.
          </p>
        </div>
        <Button
          onClick={() => setInviteModalOpen(true)}
          variant="primary"
          size="sm"
          icon={UserPlus}
        >
          Invite Candidate
        </Button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Pipeline</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{candidates?.length || 0}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Evaluated</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {(candidates || []).filter(c => c.status === 'Completed' || c.status === 'Evaluated' || c.overall_score || c.overallScore).length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">In Progress</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {(candidates || []).filter(c => c.status === 'Reviewing' || c.status === 'In Progress').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Invited</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">
            {(candidates || []).filter(c => c.status === 'Invited' || (!c.status && !c.overall_score && !c.overallScore)).length}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 space-x-1">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'Completed', label: 'Evaluated' },
            { id: 'Reviewing', label: 'In Progress' },
            { id: 'Invited', label: 'Invited' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Candidate Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, email, role..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Main Candidate Table */}
      {filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          description={
            search 
              ? "No candidate records match your search filter. Try clearing your search query."
              : "No candidates have been invited yet. Invite your first candidate to begin assessments."
          }
          actionLabel="Invite Candidate"
          onAction={() => setInviteModalOpen(true)}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Target Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Overall Score</th>
                  <th className="px-5 py-3">Recommendation</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((cand) => {
                  const score = cand.overall_score ?? cand.overallScore;
                  const targetInterview = (interviews || []).find(i => i.id === (cand.interviewId || cand.interview_id));
                  const isEvaluated = cand.status === 'Completed' || cand.status === 'Evaluated' || score !== undefined;

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate Avatar & Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <Avatar name={cand.name} size="sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate">{cand.name}</span>
                            <span className="text-[11px] text-slate-500 truncate">{cand.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Role & Assessment */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-900 truncate">
                            {cand.role || targetInterview?.jobRole || targetInterview?.title || 'General Engineering'}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {targetInterview?.title || 'Standard Assessment'}
                          </span>
                        </div>
                      </td>

                      {/* Assessment Status */}
                      <td className="px-5 py-3.5">
                        {getStatusBadge(cand)}
                      </td>

                      {/* Overall Score */}
                      <td className="px-5 py-3.5">
                        {score !== undefined && score !== null ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{score}%</span>
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden md:block">
                              <div 
                                className={`h-full rounded-full ${
                                  score >= 75 ? 'bg-emerald-600' : score >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Recommendation */}
                      <td className="px-5 py-3.5">
                        {getRecommendationBadge(cand.recommendation, score)}
                      </td>

                      {/* Row Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isEvaluated ? (
                          <Button
                            onClick={() => navigate(`/recruiter/candidates/${cand.id}/report`)}
                            size="xs"
                            variant="secondary"
                            icon={FileText}
                          >
                            View Report
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Awaiting assessment</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Candidate Modal Dialog */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Candidate to Assessment"
        size="md"
      >
        <form onSubmit={handleSubmit(handleInviteSubmit)} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              {...register('name', { required: 'Candidate name is required.' })}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {errors.name && <span className="text-[11px] text-red-600 font-medium">{errors.name.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Email Address *</label>
            <input
              type="email"
              placeholder="e.g. jane.doe@example.com"
              {...register('email', { 
                required: 'Candidate email is required.',
                pattern: { value: /^\S+@\S+$/i, message: 'Please enter a valid email address.' }
              })}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {errors.email && <span className="text-[11px] text-red-600 font-medium">{errors.email.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Target Assessment Track *</label>
            <select
              {...register('interviewId', { required: 'Please select an assessment track.' })}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="">Select assessment...</option>
              {activeInterviews.map((int) => (
                <option key={int.id} value={int.id}>
                  {int.title || int.jobRole} ({int.department || 'Engineering'} • {int.duration || 30} mins)
                </option>
              ))}
            </select>
            {errors.interviewId && <span className="text-[11px] text-red-600 font-medium">{errors.interviewId.message}</span>}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default CandidateList;
