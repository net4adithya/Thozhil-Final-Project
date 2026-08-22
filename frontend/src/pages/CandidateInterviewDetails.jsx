import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { candidateService } from '../services/candidateService';
import { interviewService } from '../services/interviewService';

export const CandidateInterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    const resolveData = async () => {
      if (!id) return;
      setResolving(true);
      try {
        let cand = (candidates || []).find((c) => c.id === id);
        let matchInt = null;

        if (cand) {
          matchInt = (interviews || []).find((i) => i.id === cand.interviewId || i.candidate?.id === cand.id);
          if (!matchInt && cand.interviewId) {
            matchInt = await interviewService.getInterviewById(cand.interviewId).catch(() => null);
          }
          if (!matchInt && interviews?.length > 0) {
            matchInt = interviews[0];
          }
        } else {
          // Check if id is an interview UUID
          matchInt = (interviews || []).find((i) => i.id === id);
          if (!matchInt) {
            matchInt = await interviewService.getInterviewById(id).catch(() => null);
          }
          if (matchInt) {
            cand = (candidates || []).find((c) => c.interviewId === matchInt.id || c.id === matchInt.candidate?.id) || candidates?.[0];
            if (!cand) {
              const candList = await candidateService.getCandidates().catch(() => []);
              cand = candList.find((c) => c.interviewId === matchInt.id) || candList[0];
            }
          }
        }

        if (cand) setCandidate(cand);
        if (matchInt) setInterview(matchInt);

        if (!cand && !matchInt && !loading) {
          navigate('/candidate');
        }
      } catch (err) {
        console.error('Failed to resolve interview details:', err);
      } finally {
        setResolving(false);
      }
    };

    if (!loading) {
      resolveData();
    }
  }, [id, candidates, interviews, loading, navigate]);

  if (loading || resolving || !candidate || !interview) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const isLive = (interview.type || interview.interviewType) === 'live';
  const companyInitial = ((interview.company || interview.title || 'I')[0] || 'I').toUpperCase();

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left select-none">
      
      {/* Return link */}
      <button
        onClick={() => navigate('/candidate')}
        className="inline-flex items-center text-xs font-semibold text-brandBody hover:text-brandHeading space-x-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </button>

      {/* Main card */}
      <Card className="shadow-sm">
        <CardBody className="p-6 md:p-8 space-y-6">
          
          {/* Header branding */}
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="primary">
                  {isLive ? 'Live Interview' : 'Async Interview'}
                </Badge>
                <span className="text-[10px] text-brandBody font-semibold uppercase">{interview.company || 'InterviewX'}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-brandHeading tracking-tight leading-tight">
                {interview.title}
              </h1>
              <p className="text-xs text-brandBody">
                Candidate: <span className="font-semibold text-brandHeading">{candidate.name}</span> • Assigned Role: <span className="font-semibold text-brandHeading">{interview.jobRole || 'Engineering'}</span>
              </p>
            </div>
            
            <div className="shrink-0 bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border border-primary/20">
              {companyInitial}
            </div>
          </div>

          <hr className="border-brandBorder" />

          {/* Core metadata stats */}
          <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 border border-brandBorder rounded-xl p-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-brandBody block">Format</span>
              <span className="text-xs font-bold text-brandHeading">{isLive ? 'Live Conversation (Sarvam Voice)' : 'Pre-recorded'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brandBody block">Questions</span>
              <span className="text-xs font-bold text-brandHeading">{interview.questions?.length || 0} Items</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brandBody block">Time Limit</span>
              <span className="text-xs font-bold text-brandHeading">{interview.duration || 30} Mins</span>
            </div>
          </div>

          {/* Description instructions section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brandHeading flex items-center space-x-1.5 font-sans">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" />
              <span>Assessment Instructions & Expectations</span>
            </h3>

            <div className="space-y-3.5 text-xs text-brandBody leading-relaxed">
              <p>
                {isLive 
                  ? "You are entering a Live AI Interview experience. You will engage in an interactive real-time vocal conversation with our virtual interviewer host Ava (powered by Sarvam STT & TTS). The system will ask role-specific questions and dynamically construct custom follow-up prompts based on your responses." 
                  : "You are entering an Async Pre-recorded Interview experience. You will face a predefined series of questions. For each question, you will be allocated preparation time followed by automated recording limits. You can review your transcribed answers and code submissions before submitting."
                }
              </p>

              <div className="bg-blue-50/50 border border-primary/15 rounded-xl p-4 space-y-2">
                <span className="font-bold text-brandHeading block text-xs">Guidelines for Success:</span>
                <ul className="list-disc pl-5 space-y-1 text-brandBody">
                  <li>Find a quiet space with minimal background noise levels.</li>
                  <li>Ensure your face is clearly visible inside the camera bounds.</li>
                  <li>Do not leave, reload, or navigate away from the browser window once inside.</li>
                  <li>Use the Device Check wizard on the next step to confirm your camera & microphone levels.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action trigger */}
          <div className="pt-2">
            <Button
              onClick={() => navigate(`/candidate/interviews/${interview.id}/device-check`)}
              variant="primary"
              className="w-full py-3 text-sm font-bold"
              icon={ArrowRight}
              iconPosition="right"
            >
              Start Interview Setup
            </Button>
          </div>

        </CardBody>
      </Card>

    </div>
  );
};

export default CandidateInterviewDetails;
