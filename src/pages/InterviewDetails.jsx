import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Video,
  Copy,
  CheckCircle,
  UserPlus,
  ArrowLeft,
  Mail,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Breadcrumb } from '../components/ui/Breadcrumb';

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
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!loading && interviews.length > 0) {
      const match = interviews.find((i) => i.id === id);
      if (match) {
        setInterview(match);
      } else {
        navigate('/recruiter/interviews');
      }
    }
  }, [id, interviews, loading, navigate]);

  if (loading || !interview) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const interviewCandidates = candidates.filter((c) => c.interviewId === id);

  // Link that candidates can use to simulate joining the interview room
  const mockCandidateLink = `${window.location.origin}/candidate?interviewId=${interview.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mockCandidateLink);
    showToast('Assessment invitation link copied to clipboard!', 'success');
  };

  const handleInviteSubmit = async (data) => {
    try {
      setSubmitting(true);
      await inviteCandidate({
        name: data.name,
        email: data.email,
        role: interview.title,
        interviewId: interview.id
      });
      setInviteModalOpen(false);
      reset();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Completed') return <Badge variant="success">Completed</Badge>;
    if (status === 'Reviewing') return <Badge variant="warning">Reviewing</Badge>;
    return <Badge variant="primary">Invited</Badge>;
  };

  const breadcrumbs = [
    { label: 'Workspace', path: '/recruiter' },
    { label: 'Interviews', path: '/recruiter/interviews' },
    { label: interview.title }
  ];

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col space-y-2 select-none">
        <button
          onClick={() => navigate('/recruiter/interviews')}
          className="inline-flex items-center text-xs font-semibold text-brandBody hover:text-brandHeading space-x-1 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to interviews</span>
        </button>
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 border border-primary/20">
            <Video className="w-7 h-7" />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-brandBody">{interview.department}</span>
            <h1 className="text-2xl font-bold tracking-tight text-brandHeading leading-tight">{interview.title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          <Button
            onClick={() => setInviteModalOpen(true)}
            variant="primary"
            size="sm"
            icon={UserPlus}
          >
            Invite Candidate
          </Button>
        </div>
      </div>

      {/* KPIs & Invitation Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
        {/* Detail parameters */}
        <Card className="lg:col-span-2">
          <CardBody className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div className="space-y-1">
              <span className="text-xs text-brandBody uppercase font-semibold">Total Invited</span>
              <p className="text-xl font-bold text-brandHeading">{interviewCandidates.length}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-brandBody uppercase font-semibold">Completions</span>
              <p className="text-xl font-bold text-brandHeading">
                {interviewCandidates.filter(c => c.status === 'Completed').length}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-brandBody uppercase font-semibold">Assigned Questions</span>
              <p className="text-xl font-bold text-brandHeading">{interview.questions.length}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-brandBody uppercase font-semibold">Created Date</span>
              <p className="text-xl font-bold text-brandHeading">{interview.createdDate}</p>
            </div>
          </CardBody>
        </Card>

        {/* Invite link share */}
        <Card>
          <CardBody className="p-5 text-left space-y-3">
            <span className="text-xs text-brandBody uppercase font-semibold block">Candidate Link</span>
            <p className="text-xs text-brandBody leading-relaxed">
              Share this access link for candidates to start the assessment.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={mockCandidateLink}
                className="w-full text-xs text-brandBody bg-gray-50 border border-brandBorder rounded-lg px-3 py-2 outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 border border-brandBorder hover:border-gray-300 rounded-lg text-brandBody hover:text-brandHeading bg-white transition-all hover:bg-gray-50 shrink-0"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Candidate applicants list table */}
      <div className="flex-1 flex flex-col space-y-3">
        <h3 className="text-base font-bold text-brandHeading text-left">Applied Candidates</h3>
        <Table
          headers={['Candidate', 'Email Address', 'Status', 'AI Match Score', 'Submittal Date', 'Action']}
          data={interviewCandidates}
          emptyMessage="No candidates have applied to this job yet. Send invites to get started!"
          renderRow={(cand) => (
            <tr key={cand.id} className="hover:bg-gray-50/50">
              <td className="px-6 py-4.5 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                  <Avatar name={cand.name} size="sm" />
                  <span className="font-bold text-brandHeading">{cand.name}</span>
                </div>
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap text-brandBody">{cand.email}</td>
              <td className="px-6 py-4.5 whitespace-nowrap">{getStatusBadge(cand.status)}</td>
              <td className="px-6 py-4.5 whitespace-nowrap">
                <span className={`font-bold ${
                  cand.overallScore ? (cand.overallScore >= 80 ? 'text-brandSuccess' : cand.overallScore >= 70 ? 'text-primary' : 'text-brandWarning') : 'text-gray-400'
                }`}>
                  {cand.overallScore ? `${cand.overallScore}%` : '—'}
                </span>
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap text-brandBody">
                {cand.completionDate || 'Pending completion'}
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap">
                {cand.status === 'Completed' || cand.status === 'Reviewing' ? (
                  <Button
                    onClick={() => navigate(`/recruiter/candidates/${cand.id}/report`)}
                    variant="secondary"
                    size="sm"
                    icon={ExternalLink}
                    iconPosition="right"
                  >
                    View Report
                  </Button>
                ) : (
                  <span className="text-xs text-brandBody font-semibold italic">Awaiting assessment</span>
                )}
              </td>
            </tr>
          )}
        />
      </div>

      {/* Invite Candidate Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Candidate"
      >
        <form onSubmit={handleSubmit(handleInviteSubmit)} className="space-y-4 text-left">
          <Input
            label="Full Name"
            placeholder="John Doe"
            required
            icon={User}
            error={errors.name}
            {...register('name', { required: 'Candidate full name is required.' })}
          />
          <Input
            label="Email Address"
            placeholder="john.doe@example.com"
            type="email"
            required
            icon={Mail}
            error={errors.email}
            {...register('email', {
              required: 'Email address is required.',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address structure.'
              }
            })}
          />
          
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-brandBorder">
            <Button onClick={() => setInviteModalOpen(false)} variant="ghost" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
