import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowRight, 
  Clock, 
  FileText, 
  Filter, 
  Video, 
  Layers, 
  HelpCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

export const CandidateDashboard = () => {
  const { candidates, interviews, loading } = useApp();
  const navigate = useNavigate();

  // Dynamic candidate selection
  const [activeCandId, setActiveCandId] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'async' | 'live'

  useEffect(() => {
    if (candidates && candidates.length > 0) {
      if (!activeCandId || !candidates.find((c) => c.id === activeCandId)) {
        setActiveCandId(candidates[0].id);
      }
    }
  }, [candidates, activeCandId]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeCandidate = (candidates && candidates.find((c) => c.id === activeCandId)) || candidates?.[0] || null;

  // Find associated interview details for a candidate
  const getInterviewForCandidate = (cand) => {
    if (!cand) return null;
    return interviews.find((i) => i.id === cand.interviewId || i.candidate?.id === cand.id || i.candidate_id === cand.id);
  };

  // Find assigned upcoming assessments for active candidate
  const assignedInterview = activeCandidate ? getInterviewForCandidate(activeCandidate) : null;

  // Filter available system interviews for general practice
  const availableInterviews = (interviews || []).filter((int) => {
    const intFormat = int.type || int.interviewType || 'async';
    if (activeFilter === 'async' && intFormat !== 'async') return false;
    if (activeFilter === 'live' && intFormat !== 'live') return false;
    return true;
  });

  // Filter completed candidates
  const completedCandidates = (candidates || []).filter((c) => {
    if (c.status !== 'Completed' && c.status !== 'Reviewing') return false;
    return true;
  });

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left select-none">
      
      {/* Simulation / Persona Selector Bar */}
      {candidates && candidates.length > 0 && (
        <div className="bg-blue-50/50 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-brandHeading flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-primary" />
            <span>Candidate Persona:</span>
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-brandBody">Logged in as:</span>
            <select
              value={activeCandId || ''}
              onChange={(e) => setActiveCandId(e.target.value)}
              className="bg-white border border-brandBorder rounded px-2.5 py-1 font-semibold text-brandHeading outline-none"
            >
              {candidates.map((c) => {
                const int = getInterviewForCandidate(c);
                const format = int ? `(${((int.type || int.interviewType || 'async')).toUpperCase()})` : '';
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.status || 'Invited'} {format}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-white border border-brandBorder rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary shrink-0 border border-primary/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-brandHeading">
              Welcome, {activeCandidate?.name || 'Candidate'}
            </h1>
            <p className="text-xs text-brandBody leading-relaxed">
              Access your role assessments, practice live & async AI interviews, verify device hardware, and review scorecards.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-brandBorder pb-2.5">
        <div className="flex space-x-1">
          {[
            { value: 'all', label: 'All Formats' },
            { value: 'async', label: 'Async Interviews' },
            { value: 'live', label: 'Live Interviews' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeFilter === tab.value 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-brandBody hover:text-brandHeading hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left side: Assigned & Available Interviews */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Assigned Interview (if any) */}
          {assignedInterview && activeCandidate?.status === 'Invited' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-brandHeading flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Your Assigned Assessment</span>
              </h3>
              
              <Card className="border-primary/30 bg-gradient-to-r from-white to-blue-50/20 shadow-md">
                <CardBody className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20">
                        {(assignedInterview.type || assignedInterview.interviewType || 'async').toUpperCase()} Assessment
                      </Badge>
                      <h4 className="text-base font-bold text-brandHeading leading-snug pt-1">
                        {assignedInterview.title}
                      </h4>
                      <div className="text-xs text-brandBody font-semibold">
                        <span>{assignedInterview.company || 'InterviewX AI'}</span> • <span>{assignedInterview.jobRole || 'Engineering'}</span>
                      </div>
                    </div>

                    <div className="shrink-0 bg-primary/10 text-primary w-11 h-11 rounded-lg flex items-center justify-center font-bold text-lg">
                      {((assignedInterview.company || assignedInterview.title || 'I')[0] || 'I').toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-[10px] text-brandBody font-semibold border-t border-brandBorder pt-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-brandBody" />
                      <span>Duration: {assignedInterview.duration || 30} mins</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-brandBody" />
                      <span>Questions: {assignedInterview.questions?.length || 0} items</span>
                    </span>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-brandBorder/50">
                    <Button
                      onClick={() => navigate(`/candidate/interviews/${activeCandidate.id}`)}
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                    >
                      Start Assessment
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* All Available Practice Interviews */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-brandHeading">Available Practice Interviews</h3>
            
            {availableInterviews.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No interviews found"
                description="Create an interview in the recruiter dashboard to practice."
              />
            ) : (
              <div className="space-y-4">
                {availableInterviews.map((int) => {
                  const isLive = (int.type || int.interviewType) === 'live';
                  const candidateTargetId = activeCandidate?.id || int.candidate?.id || int.id;

                  return (
                    <Card key={int.id} className="hover:shadow-md transition-shadow">
                      <CardBody className="p-5 space-y-4">
                        
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            {isLive ? (
                              <div className="space-y-1">
                                <Badge variant="primary" className="bg-indigo-50 text-indigo-700 border-indigo-150">
                                  Live Interview
                                </Badge>
                                <span className="text-[10px] text-brandBody block font-semibold">Real-time conversational interview (Sarvam Voice)</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="primary" className="bg-blue-50 text-blue-700 border-blue-150">
                                  Async Interview
                                </Badge>
                                <span className="text-[10px] text-brandBody block font-semibold">Recorded interview & AI evaluation</span>
                              </div>
                            )}

                            <h4 className="text-base font-bold text-brandHeading leading-snug pt-1">{int.title}</h4>
                            <div className="text-xs text-brandBody font-semibold">
                              <span>{int.company || 'InterviewX'}</span> • <span>{int.jobRole || 'Technical Candidate'}</span>
                            </div>
                          </div>

                          <div className="shrink-0 bg-primary/10 text-primary w-11 h-11 rounded-lg flex items-center justify-center font-bold text-lg">
                            {((int.company || int.title || 'I')[0] || 'I').toUpperCase()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-[10px] text-brandBody font-semibold border-t border-brandBorder pt-3">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-brandBody" />
                            <span>Duration: {int.duration || 30} mins</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 text-brandBody" />
                            <span>Questions: {int.questions?.length || 0} items</span>
                          </span>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-brandBorder/50">
                          <Button
                            onClick={() => navigate(`/candidate/interviews/${candidateTargetId}`)}
                            variant="primary"
                            size="sm"
                            icon={ArrowRight}
                            iconPosition="right"
                          >
                            Practice Interview
                          </Button>
                        </div>

                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right side: Completed Attempts & Scorecards */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-brandHeading">Completed Assessments</h3>
          
          {completedCandidates.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10 text-xs text-brandBody space-y-2">
                <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-bold text-brandHeading">No completed attempts</p>
                <p className="text-[10px] text-brandBody">Completed evaluations will appear here once submitted.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedCandidates.map((cand) => {
                const int = getInterviewForCandidate(cand);
                const isLive = (int?.type || int?.interviewType) === 'live';

                return (
                  <Card key={cand.id} className="hover:shadow-sm transition-shadow">
                    <CardBody className="p-4 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="overflow-hidden space-y-0.5">
                          <span className="text-xs font-bold text-brandHeading truncate block leading-tight">
                            {int?.title || cand.name}
                          </span>
                          <span className="text-[10px] text-brandBody block font-semibold">
                            {cand.name} • {cand.role || 'Candidate'}
                          </span>
                        </div>
                        <Badge variant="success">
                          {cand.overallScore !== null && cand.overallScore !== undefined ? `${cand.overallScore}%` : 'Completed'}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-brandBody font-mono pt-2 border-t border-brandBorder">
                        <span>Format: {isLive ? 'LIVE' : 'ASYNC'}</span>
                        <button
                          onClick={() => navigate(`/recruiter/candidates/${cand.id}/report`)}
                          className="text-primary font-bold hover:underline"
                        >
                          View Report →
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CandidateDashboard;
