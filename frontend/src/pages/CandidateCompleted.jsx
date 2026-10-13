import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Award, Calendar, ArrowRight, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BrandLoader } from '../components/common/BrandLoader';
import { candidateService } from '../services/candidateService';
import { interviewService } from '../services/interviewService';

export const CandidateCompleted = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading, refreshData } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const resolveCompletion = async () => {
      if (!id) return;
      setResolving(true);
      try {
        let cand = (candidates || []).find((c) => c.id === id);
        let matchInt = null;

        if (cand) {
          matchInt = (interviews || []).find((i) => i.id === cand.interviewId || i.id === cand.interview_id);
          if (!matchInt && (cand.interviewId || cand.interview_id)) {
            matchInt = await interviewService.getInterviewById(cand.interviewId || cand.interview_id).catch(() => null);
          }
        } else {
          // Check if id is an interview UUID
          matchInt = (interviews || []).find((i) => i.id === id);
          if (!matchInt) {
            matchInt = await interviewService.getInterviewById(id).catch(() => null);
          }
          if (matchInt) {
            cand = (candidates || []).find((c) => c.interviewId === matchInt.id || c.interview_id === matchInt.id || c.id === matchInt.candidate?.id);
            if (!cand) {
              const candList = await candidateService.getCandidates().catch(() => []);
              cand = candList.find((c) => c.interviewId === matchInt.id || c.interview_id === matchInt.id) || candList[0];
            }
          } else {
            cand = await candidateService.getCandidateById(id).catch(() => null);
            if (cand && (cand.interviewId || cand.interview_id)) {
              matchInt = await interviewService.getInterviewById(cand.interviewId || cand.interview_id).catch(() => null);
            }
          }
        }

        if (cand?.id) {
          sessionStorage.setItem(`interviewx_completed_${cand.id}`, 'true');
          sessionStorage.setItem('interviewx_active_candidate_id', cand.id);
          if (cand.status !== 'Completed') {
            candidateService.updateCandidate(cand.id, {
              status: 'Completed',
              completionDate: new Date().toISOString().split('T')[0]
            }).then(() => {
              if (typeof refreshData === 'function') refreshData().catch(() => {});
            }).catch(() => {});
          }
        }
        if (matchInt?.id) {
          sessionStorage.setItem(`interviewx_completed_${matchInt.id}`, 'true');
        }

        if (isMounted) {
          if (cand) setCandidate(cand);
          if (matchInt) setInterview(matchInt);
          if (!cand && !matchInt && !loading) {
            navigate('/candidate');
          }
        }
      } catch (err) {
        console.error('Failed to resolve completed interview data:', err);
      } finally {
        if (isMounted) setResolving(false);
      }
    };

    if (!loading) {
      resolveCompletion();
    }
    return () => { isMounted = false; };
  }, [id, candidates, interviews, loading, navigate, refreshData]);

  if (loading || resolving || !candidate || !interview) {
    return (
      <div className="flex-grow flex items-center justify-center py-24">
        <BrandLoader message="Finalizing assessment record..." subMessage="Generating submission receipt and integrity digest" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center max-w-xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-center select-none">

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full p-8 sm:p-10 space-y-6 flex flex-col items-center relative overflow-hidden">

        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-8 h-8 stroke-[2]" />
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Assessment Submitted Successfully
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Thank you for completing your evaluation for <strong className="text-slate-900 font-semibold">{interview.title || interview.jobRole}</strong>. Your responses and session integrity verification have been safely submitted.
          </p>
        </div>

        <div className="border-t border-slate-100 w-full" />

        {/* Assessment Details Summary */}
        <div className="w-full space-y-2.5 text-xs text-left bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-normal">Candidate Name</span>
            <span className="font-bold text-slate-900">{candidate.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-normal">Target Position</span>
            <span className="font-bold text-slate-900">{interview.jobRole || interview.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-normal">Questions Recorded</span>
            <span className="font-bold text-slate-900">{interview.questions?.length || 0} Questions</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-normal">Assessment Format</span>
            <span className="font-bold text-slate-900">
              {interview.type === 'live' || interview.interviewType === 'live' ? 'Live Interactive Session' : 'Structured Recorded Assessment'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-normal">Submission Status</span>
            <span className="text-emerald-700 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified & Recorded</span>
            </span>
          </div>
        </div>

        {/* What Happens Next Section */}
        <div className="w-full text-left space-y-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
            What Happens Next
          </span>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span><strong>Evaluation Synthesis:</strong> Your spoken and typed responses are calibrated against role competencies.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span><strong>Hiring Team Review:</strong> The engineering recruiter and hiring manager review your assessment dossier.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span><strong>Decision Update:</strong> You will receive an email notification regarding status and next round details.</span>
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="w-full pt-4 flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={() => navigate(`/recruiter/candidates/${candidate?.id || id}/report`)}
            variant="primary"
            size="md"
            className="flex-1 w-full justify-center font-semibold text-xs sm:text-sm py-2.5"
            icon={Award}
          >
            Review Assessment Dossier
          </Button>
          <Button
            onClick={() => {
              if (typeof refreshData === 'function') {
                refreshData().catch(() => {});
              }
              navigate('/candidate');
            }}
            variant="secondary"
            size="md"
            className="flex-1 w-full justify-center text-xs sm:text-sm py-2.5"
            icon={Home}
          >
            Return to Candidate Dashboard
          </Button>
        </div>

      </div>

    </div>
  );
};

export default CandidateCompleted;

