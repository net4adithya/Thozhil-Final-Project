import React, { useState } from 'react';
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
  Calendar
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

  // Switch between candidates to simulate different dashboard views
  const [activeCandId, setActiveCandId] = useState('cand-6'); // Default to Kyle Reese (Invited to Live)
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'async' | 'live'

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeCandidate = candidates.find((c) => c.id === activeCandId) || candidates[0];
  
  // Find associated interview details
  const getInterviewForCandidate = (cand) => {
    return interviews.find((i) => i.id === cand.interviewId);
  };

  // Filter candidates list for dashboard demonstration
  const upcomingAssessments = candidates.filter((c) => {
    if (c.status !== 'Invited') return false;
    const interview = getInterviewForCandidate(c);
    if (!interview) return false;
    
    // Apply type filter
    if (activeFilter === 'async' && interview.interviewType !== 'async') return false;
    if (activeFilter === 'live' && interview.interviewType !== 'live') return false;
    
    return true;
  });

  const completedAssessments = candidates.filter((c) => {
    if (c.status !== 'Completed' && c.status !== 'Reviewing') return false;
    const interview = getInterviewForCandidate(c);
    if (!interview) return false;
    
    // Apply type filter
    if (activeFilter === 'async' && interview.interviewType !== 'async') return false;
    if (activeFilter === 'live' && interview.interviewType !== 'live') return false;
    
    return true;
  });

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left select-none">
      
      {/* Simulation Selector Bar */}
      <div className="bg-blue-50/50 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-brandHeading flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-primary" />
          <span>Candidate Persona Simulation:</span>
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-brandBody">Logged in as:</span>
          <select
            value={activeCandId}
            onChange={(e) => setActiveCandId(e.target.value)}
            className="bg-white border border-brandBorder rounded px-2.5 py-1 font-semibold text-brandHeading outline-none"
          >
            {candidates.map((c) => {
              const int = getInterviewForCandidate(c);
              const intType = int ? `(${int.interviewType.toUpperCase()})` : '';
              return (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.status} {intType}
                </option>
              );
            })}
          </select>
        </div>
      </div>

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
              Access your upcoming job screenings, test hardware device capture feeds, and review completed logs.
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
        
        {/* Left side: Upcoming/In Progress Assessments */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-brandHeading">Upcoming & In Progress Interviews</h3>
          
          {upcomingAssessments.filter(c => c.id === activeCandId).length === 0 ? (
            <EmptyState
              icon={Video}
              title="No upcoming interviews"
              description={`There are no active invitations for ${activeCandidate?.name} matching this format filter.`}
            />
          ) : (
            <div className="space-y-4">
              {upcomingAssessments.filter(c => c.id === activeCandId).map((cand) => {
                const int = getInterviewForCandidate(cand);
                if (!int) return null;
                const isLive = int.interviewType === 'live';

                return (
                  <Card key={cand.id} className="hover:shadow-md transition-shadow">
                    <CardBody className="p-5 space-y-4">
                      
                      {/* Badge and title header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          {/* Visual badges treatments based on type */}
                          {isLive ? (
                            <div className="space-y-1">
                              <Badge variant="primary" className="bg-indigo-50 text-indigo-700 border-indigo-150">
                                Live Interview
                              </Badge>
                              <span className="text-[10px] text-brandBody block font-semibold">Real-time conversational interview</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="primary" className="bg-blue-50 text-blue-700 border-blue-150">
                                Async Interview
                              </Badge>
                              <span className="text-[10px] text-brandBody block font-semibold">Recorded interview</span>
                            </div>
                          )}

                          <h4 className="text-base font-bold text-brandHeading leading-snug pt-1">{int.title}</h4>
                          <div className="text-xs text-brandBody font-semibold">
                            <span>{int.company}</span> • <span>{int.jobRole}</span>
                          </div>
                        </div>

                        <div className="shrink-0 bg-primary/10 text-primary w-11 h-11 rounded-lg flex items-center justify-center font-bold text-lg">
                          {int.company[0].toUpperCase()}
                        </div>
                      </div>

                      {/* Mini metadata layout */}
                      <div className="flex items-center space-x-4 text-[10px] text-brandBody font-semibold border-t border-brandBorder pt-3">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-brandBody" />
                          <span>Duration: {int.duration} mins</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-brandBody" />
                          <span>Questions: {int.questions?.length || 0} items</span>
                        </span>
                      </div>

                      {/* Action Row */}
                      <div className="flex justify-end pt-2 border-t border-brandBorder/50">
                        <Button
                          onClick={() => navigate(`/candidate/interviews/${cand.id}`)}
                          variant="primary"
                          size="sm"
                          icon={ArrowRight}
                          iconPosition="right"
                        >
                          Start Interview
                        </Button>
                      </div>

                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side: Completed Attempts log */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-brandHeading">Completed Interviews</h3>
          
          {completedAssessments.filter(c => c.id === activeCandId).length === 0 ? (
            <Card>
              <CardBody className="text-center py-10 text-xs text-brandBody space-y-2">
                <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-bold text-brandHeading">No completed attempts</p>
                <p className="text-[10px] text-brandBody">Completed reports will appear here once submitted.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedAssessments.filter(c => c.id === activeCandId).map((cand) => {
                const int = getInterviewForCandidate(cand);
                if (!int) return null;
                const isLive = int.interviewType === 'live';

                return (
                  <Card key={cand.id}>
                    <CardBody className="p-4 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="overflow-hidden space-y-0.5">
                          <span className="text-xs font-bold text-brandHeading truncate block leading-tight">{int.title}</span>
                          <span className="text-[10px] text-brandBody block font-semibold">{int.company}</span>
                        </div>
                        <Badge variant="success">Completed</Badge>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-brandBody font-mono pt-2 border-t border-brandBorder">
                        <span>Format: {isLive ? 'LIVE' : 'ASYNC'}</span>
                        <span>Date: {cand.completionDate || '2026-08-08'}</span>
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
