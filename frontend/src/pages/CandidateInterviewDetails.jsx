import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, CheckCircle2, ShieldCheck, ArrowRight, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BrandLoader } from '../components/common/BrandLoader';
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
          const targetIntId = cand.interviewId || cand.interview_id;
          matchInt = (interviews || []).find((i) => i.id === targetIntId || i.candidate?.id === cand.id || i.candidate_id === cand.id || i.candidateId === cand.id);
          if (!matchInt && targetIntId) {
            matchInt = await interviewService.getInterviewById(targetIntId).catch(() => null);
          }
          if (!matchInt && interviews?.length > 0) {
            matchInt = interviews.find((i) => i.jobRole === cand.role || i.title === cand.role) || interviews[0];
          }
        } else {
          matchInt = (interviews || []).find((i) => i.id === id);
          if (!matchInt) {
            matchInt = await interviewService.getInterviewById(id).catch(() => null);
          }
          if (matchInt) {
            const activeCandId = sessionStorage.getItem('interviewx_active_candidate_id');
            const targetCandId = matchInt.candidate_id || matchInt.candidateId || matchInt.candidate?.id || activeCandId;
            if (targetCandId) {
              cand = (candidates || []).find((c) => c.id === targetCandId) || await candidateService.getCandidateById(targetCandId).catch(() => null);
            }
            if (!cand) {
              cand = (candidates || []).find((c) => c.interviewId === matchInt.id || c.interview_id === matchInt.id) || candidates?.[0];
            }
            if (!cand) {
              const candList = await candidateService.getCandidates().catch(() => []);
              cand = candList.find((c) => c.interviewId === matchInt.id || c.interview_id === matchInt.id) || candList[0];
            }
          }
        }

        if (cand?.id) {
          try { sessionStorage.setItem('interviewx_active_candidate_id', cand.id); } catch (e) {}
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
      <div className="flex-grow flex items-center justify-center py-24">
        <BrandLoader message="Loading assessment briefing..." subMessage="Calibrating environment & technical guidelines" />
      </div>
    );
  }

  const isLive = (interview.type || interview.interviewType) === 'live';

  return (
    <div className="space-y-6 flex-grow flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left font-sans text-slate-900">
      
      {/* Return link */}
      <button
        onClick={() => navigate('/candidate')}
        className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 space-x-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Candidate Portal</span>
      </button>

      {/* Main card */}
      <div className="bg-white rounded-xl p-8 sm:p-10 shadow-xs space-y-6 relative overflow-hidden border border-slate-200">
        {/* Header branding */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant={isLive ? 'live' : 'secondary'} size="xs">
              {isLive ? 'Live Interview' : 'Recorded Assessment'}
            </Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-blue-600 font-semibold">{interview.department || 'Engineering'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {interview.title || interview.jobRole}
          </h1>
          <p className="text-xs text-slate-500">
            Prepared for <strong className="text-slate-900 font-semibold">{candidate.name}</strong>
          </p>
        </div>

        {/* Metadata stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs shadow-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Format</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {isLive ? 'Live Conversational' : 'Recorded Video'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Language</span>
            <span className="font-semibold text-blue-700 mt-0.5 block">
              {(() => {
                const langObj = interview.settings?.language || interview.language;
                const code = typeof langObj === 'object' ? langObj?.code : langObj;
                const mode = typeof langObj === 'object' ? langObj?.mode : (typeof langObj === 'string' && langObj.includes('codemix') ? 'codemix' : 'native');
                if (code === 'ta-IN' || (typeof code === 'string' && code.includes('ta'))) {
                  return mode === 'codemix' ? 'தமிழ் (Tamil + English)' : 'தமிழ் (Tamil)';
                }
                return 'English';
              })()}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Questions</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {interview.questions?.length || 0} Questions
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Time Allocated</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {interview.duration || 30} Minutes
            </span>
          </div>
        </div>

        {/* Guidelines */}
        <div className="space-y-3 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Before You Begin</h2>
          <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Ensure you are in a quiet, well-lit environment with minimal background distractions.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Have your camera and microphone connected. We will run an equipment check on the next screen.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Maintain your browser window in full-screen focus throughout the session.</span>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium">Next step: Hardware Diagnostics</span>
          <Button
            onClick={() => navigate(`/candidate/interviews/${interview.id || candidate.interviewId || candidate.interview_id}/device-check`)}
            variant="primary"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
          >
            Continue to Equipment Check
          </Button>
        </div>

      </div>

    </div>
  );
};

export default CandidateInterviewDetails;
