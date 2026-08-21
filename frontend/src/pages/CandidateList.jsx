import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Users, UserPlus, Search, Mail, User, Briefcase, ChevronRight, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

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
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const filteredCandidates = candidates.filter((cand) => {
    const statusMatch = filter === 'ALL' || cand.status === filter;
    const searchMatch =
      cand.name.toLowerCase().includes(search.toLowerCase()) ||
      cand.email.toLowerCase().includes(search.toLowerCase()) ||
      cand.role.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const getStatusBadge = (status) => {
    if (status === 'Completed') return <Badge variant="success">Completed</Badge>;
    if (status === 'Reviewing') return <Badge variant="warning">Reviewing</Badge>;
    return <Badge variant="primary">Invited</Badge>;
  };

  const handleInviteSubmit = async (data) => {
    try {
      setSubmitting(true);
      const selectedInt = interviews.find((i) => i.id === data.interviewId);
      await inviteCandidate({
        name: data.name,
        email: data.email,
        role: selectedInt ? selectedInt.title : 'General',
        interviewId: data.interviewId
      });
      setInviteModalOpen(false);
      reset();
      // Remove invite URL parameter
      navigate('/recruiter/candidates', { replace: true });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const activeInterviews = interviews.filter(i => i.status === 'Active');
  const interviewOptions = activeInterviews.map((i) => ({
    value: i.id,
    label: `${i.title} (${i.department})`
  }));

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Candidates Hub</h1>
          <p className="text-sm text-brandBody">Review scores, status, transcripts, and analysis outcomes.</p>
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

      {/* Filters Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brandBorder pb-2 select-none">
        {/* Status filters */}
        <div className="flex items-center space-x-2.5 overflow-x-auto">
          {['ALL', 'Completed', 'Reviewing', 'Invited'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                tab === filter
                  ? 'bg-primary text-white'
                  : 'bg-white border border-brandBorder text-brandBody hover:text-brandHeading hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search input control */}
        <div className="w-full md:max-w-xs relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brandBody">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-white text-brandHeading border border-brandBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 py-2.5 pl-9 pr-3.5"
          />
        </div>
      </div>

      {/* Main Datatable */}
      <div className="flex-grow flex flex-col">
        <Table
          headers={['Candidate', 'Hiring Target', 'Status', 'Match Rating', 'Grading Date', 'Action']}
          data={filteredCandidates}
          emptyMessage="No candidates matched the filters selected."
          renderRow={(cand) => (
            <tr key={cand.id} className="hover:bg-gray-50/50">
              <td className="px-6 py-4.5 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                  <Avatar name={cand.name} size="sm" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-brandHeading leading-tight">{cand.name}</span>
                    <span className="text-xs text-brandBody">{cand.email}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap text-left">
                <span className="text-sm font-semibold text-brandHeading truncate max-w-xs block">{cand.role}</span>
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap">{getStatusBadge(cand.status)}</td>
              <td className="px-6 py-4.5 whitespace-nowrap">
                {cand.overallScore ? (
                  <span className={`font-bold text-sm ${
                    cand.overallScore >= 80 ? 'text-brandSuccess' : cand.overallScore >= 70 ? 'text-primary' : 'text-brandWarning'
                  }`}>
                    {cand.overallScore}%
                  </span>
                ) : (
                  <span className="text-gray-400 font-semibold text-xs">Awaiting exam</span>
                )}
              </td>
              <td className="px-6 py-4.5 whitespace-nowrap text-brandBody">
                {cand.completionDate || '—'}
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
                  <span className="text-xs text-brandBody font-semibold italic">Pending...</span>
                )}
              </td>
            </tr>
          )}
        />
      </div>

      {/* Invite Candidate Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          navigate('/recruiter/candidates', { replace: true });
        }}
        title="Invite New Candidate"
      >
        {activeInterviews.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm text-brandBody leading-relaxed">
              You must have at least one active job opening before sending assessments.
            </p>
            <Button onClick={() => navigate('/recruiter/interviews/create')} variant="primary" size="sm">
              Create Job Opening
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleInviteSubmit)} className="space-y-4 text-left">
            <Input
              label="Candidate Full Name"
              placeholder="Sarah Connor"
              required
              icon={User}
              error={errors.name}
              {...register('name', { required: 'Candidate name is required.' })}
            />
            <Input
              label="Email Address"
              placeholder="sarah.c@skymail.net"
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
            
            <Select
              label="Assign to Interview Loop"
              placeholder="Choose active opening"
              required
              options={interviewOptions}
              error={errors.interviewId}
              {...register('interviewId', { required: 'Hiring opening selection is required.' })}
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
        )}
      </Modal>
    </div>
  );
};
