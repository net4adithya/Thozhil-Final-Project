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
  CheckCircle2, 
  Sparkles, 
  Radio
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

  // Dynamic candidate persona selector (for demo/development)
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

  // 1:N Relationship — find all interviews assigned to the active candidate (via interviews.candidate_id)
  const assignedInterviews = (interviews || []).filter((int) => {
    const isAssigned = int.candidate?.id === activeCandidate?.id || int.candidate_id === activeCandidate?.id;
    if (!isAssigned) return false;
    if (activeFilter === 'async' && int.type !== 'async') return false;
    if (activeFilter === 'live' && int.type !== 'live') return false;
    return true;
  });

  // Practice / Unassigned interviews (interviews not assigned to any candidate)
  const practiceInterviews = (interviews || []).filter((int) => {
    const isUnassigned = !int.candidate?.id && !int.candidate_id;
    if (!isUnassigned) return false;
    if (activeFilter === 'async' && int.type !== 'async') return false;
    if (activeFilter === 'live' && int.type !== 'live') return false;
    return true;
  });

  // Completed evaluations list for reporting
  const completedCandidates = (candidates || []).filter((c) => {
    return c.status === 'Completed' || c.status === 'Reviewing';
  });

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left select-none">
      
      {/* Simulation / Persona Selector Bar (Demo helper) */}
      {candidates && candidates.length > 0 && (
        <div className="bg-blue-50/50 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-brandHeading flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-primary" />
            <span>Active Candidate Persona (Development Demo):</span>
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-brandBody">Candidate:</span>
            <select
              value={activeCandId || ''}
              onChange={(e) => setActiveCandId(e.target.value)}
              className="bg-white border border-brandBorder rounded px-2.5 py-1 font-semibold text-brandHeading outline-none"
            >
              {candidates.map((c) => {
                const count = (interviews || []).filter((i) => i.candidate?.id === c.id || i.candidate_id === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count} {count === 1 ? 'interview' : 'interviews'} assigned) - {c.status || 'Invited'}
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
              Role: <span className="font-semibold text-brandHeading">{activeCandidate?.role || 'Technical Candidate'}</span> • 
              Status: <span className="font-semibold text-brandHeading">{activeCandidate?.status || 'Invited'}</span>
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

      {/* Grid Layout: Assigned & Practice Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Assigned & Practice Interviews */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Assigned Assessments for this Candidate */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-brandHeading flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Assigned Assessments ({assignedInterviews.length})</span>
            </h3>

            {assignedInterviews.length === 0 ? (
              <Card>
                <CardBody className="text-center py-8 text-xs text-brandBody space-y-1">
                  <p className="font-semibold text-brandHeading">No assessments currently assigned</p>
                  <p className="text-[10px]">Create an interview for this candidate in the recruiter portal or explore practice assessments below.</p>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-4">
                {assignedInterviews.map((int) => {
                  const isLive = int.type === 'live';
                  return (
                    <Card key={int.id} className="border-primary/20 hover:shadow-md transition-shadow">
                      <CardBody className="p-5 space-y-4">
                        
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="primary" className={isLive ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                {isLive ? 'Live Voice Assessment' : 'Async Assessment'}
                              </Badge>
                              <Badge variant={int.status === 'Completed' ? 'success' : 'secondary'}>
                                {int.status || 'Active'}
                              </Badge>
                            </div>
                            <h4 className="text-base font-bold text-brandHeading leading-snug pt-1">{int.title}</h4>
                            <div className="text-xs text-brandBody font-semibold">
                              <span>{int.company || 'InterviewX'}</span> • <span>{int.jobRole || 'Engineering'}</span>
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
                            onClick={() => navigate(`/candidate/interviews/${int.id}`)}
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
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Available Practice Interviews */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-brandHeading flex items-center space-x-2">
              <Radio className="w-4 h-4 text-brandBody" />
              <span>Available Practice Interviews ({practiceInterviews.length})</span>
            </h3>
            
            {practiceInterviews.length === 0 ? (
              <Card>
                <CardBody className="text-center py-6 text-xs text-brandBody">
                  <p className="text-[10px]">All interviews are currently assigned to candidates.</p>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-4">
                {practiceInterviews.map((int) => {
                  const isLive = int.type === 'live';
                  return (
                    <Card key={int.id} className="hover:shadow-sm transition-shadow">
                      <CardBody className="p-5 space-y-4">
                        
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <Badge variant="secondary">
                              Practice Mode ({isLive ? 'Live Voice' : 'Async'})
                            </Badge>
                            <h4 className="text-base font-bold text-brandHeading leading-snug pt-1">{int.title}</h4>
                            <div className="text-xs text-brandBody font-semibold">
                              <span>{int.company || 'InterviewX'}</span> • <span>{int.jobRole || 'Engineering'}</span>
                            </div>
                          </div>

                          <div className="shrink-0 bg-gray-100 text-brandHeading w-11 h-11 rounded-lg flex items-center justify-center font-bold text-lg">
                            {((int.company || int.title || 'P')[0] || 'P').toUpperCase()}
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
                            onClick={() => navigate(`/candidate/interviews/${int.id}`)}
                            variant="secondary"
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

        {/* Right Column: Scorecards & Completed Attempts */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-brandHeading">Completed Evaluations</h3>
          
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
                return (
                  <Card key={cand.id} className="hover:shadow-sm transition-shadow">
                    <CardBody className="p-4 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="overflow-hidden space-y-0.5">
                          <span className="text-xs font-bold text-brandHeading truncate block leading-tight">
                            {cand.name}
                          </span>
                          <span className="text-[10px] text-brandBody block font-semibold">
                            {cand.role || 'Candidate'}
                          </span>
                        </div>
                        <Badge variant="success">
                          {cand.overallScore !== null && cand.overallScore !== undefined ? `${cand.overallScore}%` : 'Completed'}
                        </Badge>
                      </div>

                      <div className="flex justify-end items-center text-[9px] text-brandBody font-mono pt-2 border-t border-brandBorder">
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
