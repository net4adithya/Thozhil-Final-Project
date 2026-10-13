import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Copy,
  Check,
  UserPlus,
  ArrowLeft,
  Share2,
  Users,
  BookOpen,
  Clock,
  ShieldCheck,
  Pencil,
  Video
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { BrandLoader } from '../components/common/BrandLoader';
import { interviewService } from '../services/interviewService';
import { EditInterviewModal } from '../components/interview/EditInterviewModal';

export const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    candidates,
    interviews,
    inviteCandidate,
    showToast,
    loading
  } = useApp();

  const [interview, setInterview] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    let isMounted = true;
    const fetchInterview = async () => {
      if (id) {
        try {
          const directMatch = await interviewService.getInterviewById(id);
          if (directMatch && isMounted) {
            setInterview(directMatch);
            return;
          }
        } catch (err) {
          console.warn('Direct fetch interview error:', err.message);
        }
      }
      if (!loading && interviews.length > 0) {
        const match = interviews.find((i) => i.id === id);
        if (match && isMounted) {
          setInterview(match);
        } else if (isMounted && !interview) {
          navigate('/recruiter/interviews');
        }
      }
    };
    fetchInterview();
    return () => { isMounted = false; };
  }, [id, interviews, loading, navigate]);

  if (loading || !interview) {
    return (
      <div className="flex-grow flex items-center justify-center py-24">
        <BrandLoader message="Loading assessment track details..." subMessage="Synchronizing criteria & candidate benchmarks" />
      </div>
    );
  }

  const interviewCandidates = candidates.filter((c) => 
    c.interviewId === id || 
    c.interview_id === id ||
    c.id === interview?.candidate_id ||
    c.id === interview?.candidateId ||
    c.id === interview?.candidate?.id
  );
  const candidateInviteLink = `${window.location.origin}/candidate?interviewId=${interview.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(candidateInviteLink);
    setCopied(true);
    showToast('Assessment invitation link copied to clipboard', 'primary');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteSubmit = async (data) => {
    try {
      setSubmitting(true);
      await inviteCandidate({
        name: data.name,
        email: data.email,
        role: interview.title || interview.jobRole,
        interviewId: interview.id
      });
      setInviteModalOpen(false);
      reset();
      showToast('Invitation sent successfully.', 'primary');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const isLive = interview.type === 'live' || interview.interviewType === 'live';
  const questions = interview.questions || [];

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3 pb-2 border-b border-slate-200">
        <button
          onClick={() => navigate('/recruiter/interviews')}
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessments</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {interview.title || interview.jobRole}
              </h1>
              <Badge variant={interview.status === 'Active' || !interview.status ? 'success' : 'secondary'} size="xs">
                {interview.status || 'Active'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <span>{interview.department || 'Engineering'}</span>
              <span>•</span>
              <span>{interview.duration || 30} mins</span>
              <span>•</span>
              <span>{isLive ? 'Live Interview' : 'Recorded Assessment'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <Button
              onClick={() => setEditModalOpen(true)}
              variant="secondary"
              size="sm"
              icon={Pencil}
            >
              Edit Assessment
            </Button>
            <Button
              onClick={() => setInviteModalOpen(true)}
              variant="primary"
              size="sm"
              icon={UserPlus}
            >
              Invite Candidate
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              size="sm"
              icon={copied ? Check : Copy}
            >
              {copied ? 'Link Copied' : 'Copy Invite Link'}
            </Button>
          </div>
        </div>
      </div>

      {/* Shareable Link Box */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800">Shareable Assessment Link</span>
          <p className="text-[11px] text-slate-500">Candidates can access this specific evaluation directly with this URL.</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={candidateInviteLink}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 w-64 truncate select-all focus:outline-none focus:border-blue-600 shadow-xs"
          />
          <Button onClick={handleCopyLink} size="xs" variant="secondary">
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Candidate Roster for this opening */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Assigned Candidates</h2>
              <span className="text-[11px] text-slate-400">{interviewCandidates.length} total applicant records</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {interviewCandidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No candidates have been assigned to this assessment yet.
              </div>
            ) : (
              interviewCandidates.map((cand) => {
                const score = cand.overall_score ?? cand.overallScore;
                const isEvaluated = score !== undefined && score !== null;

                return (
                  <div key={cand.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0 pr-3">
                      <Avatar name={cand.name} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 block truncate">{cand.name}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{cand.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {isEvaluated ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">{score}%</span>
                          <span className="text-[10px] text-slate-400 block">{cand.recommendation || 'Evaluated'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          {(cand.recording_url || cand.recordingUrl) && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center space-x-1 font-semibold">
                              <Video className="w-2.5 h-2.5 text-blue-600" />
                              <span>Recorded</span>
                            </span>
                          )}
                          <Badge variant="secondary" size="xs">
                            {cand.status || 'Invited'}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center space-x-1.5">
                        <Button
                          onClick={() => navigate((isEvaluated || cand.recording_url || cand.recordingUrl || cand.status === 'Completed') ? `/recruiter/candidates/${cand.id}/report` : `/candidate?interviewId=${interview.id}&candidateId=${cand.id}`)}
                          size="xs"
                          variant={(isEvaluated || cand.recording_url || cand.recordingUrl || cand.status === 'Completed') ? 'primary' : 'secondary'}
                        >
                          {(isEvaluated || cand.recording_url || cand.recordingUrl || cand.status === 'Completed') ? 'View Report' : 'Portal'}
                        </Button>
                        {!isEvaluated && cand.status !== 'Completed' && (
                          <Button
                            onClick={() => {
                              sessionStorage.setItem('interviewx_active_candidate_id', cand.id);
                              navigate(isLive ? `/candidate/interviews/${cand.id}/live` : `/candidate/interviews/${cand.id}/async`);
                            }}
                            size="xs"
                            variant="outline"
                          >
                            Launch Room
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Configured Questions List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configured Questions</h2>
              <span className="text-[11px] text-slate-400">{questions.length} total questions</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {questions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No questions configured for this assessment.
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id || idx} className="p-4 space-y-1.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Question {idx + 1}</span>
                    <Badge variant="secondary" size="xs">{q.category || 'Technical'}</Badge>
                  </div>
                  <p className="text-xs text-slate-900 font-medium leading-relaxed">{q.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invite Candidate Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={`Invite Candidate to ${interview.title || 'Assessment'}`}
        size="md"
      >
        <form onSubmit={handleSubmit(handleInviteSubmit)} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Candidate Name</label>
            <input
              type="text"
              {...register('name', { required: 'Candidate name is required' })}
              placeholder="e.g. Jordan Lee"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {errors.name && <span className="text-[11px] text-red-600 font-medium">{errors.name.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              placeholder="jordan.lee@company.com"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
            {errors.email && <span className="text-[11px] text-red-600 font-medium">{errors.email.message}</span>}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
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
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Assessment Modal */}
      {interview && (
        <EditInterviewModal
          isOpen={editModalOpen}
          interview={interview}
          onClose={() => setEditModalOpen(false)}
          onUpdated={(updated) => {
            setInterview(updated);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default InterviewDetails;
