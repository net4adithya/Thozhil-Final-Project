import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Award, Calendar, ArrowRight, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export const CandidateCompleted = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);

  useEffect(() => {
    if (!loading && candidates.length > 0) {
      const match = candidates.find((c) => c.id === id);
      if (match) {
        setCandidate(match);
        const matchInt = interviews.find((i) => i.id === match.interviewId);
        setInterview(matchInt);
      } else {
        navigate('/candidate');
      }
    }
  }, [id, candidates, interviews, loading, navigate]);

  if (loading || !candidate || !interview) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center max-w-xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-center select-none">
      
      <Card className="shadow-lg border-brandBorder w-full">
        <CardBody className="p-8 space-y-6 flex flex-col items-center">
          
          {/* Large success circle check */}
          <div className="p-4 bg-green-50 text-brandSuccess rounded-full border border-green-100 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-brandHeading tracking-tight">Interview Completed!</h1>
            <p className="text-xs text-brandBody max-w-sm mx-auto leading-relaxed">
              Thank you for completing your assessment for <span className="font-semibold text-brandHeading">{interview.title}</span>. Your data has been securely saved.
            </p>
          </div>

          <hr className="border-brandBorder w-full" />

          {/* Assessment metrics checklist */}
          <div className="w-full space-y-2.5 text-xs text-left bg-gray-50 border border-brandBorder rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-brandBody">Candidate Name:</span>
              <span className="font-bold text-brandHeading">{candidate.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brandBody">Job opening position:</span>
              <span className="font-bold text-brandHeading">{interview.jobRole}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brandBody">Questions completed:</span>
              <span className="font-bold text-brandHeading">{interview.questions?.length || 0} Questions</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brandBody">Interview Format:</span>
              <span className="font-bold text-brandHeading uppercase">
                {interview.interviewType === 'live' ? 'Live Conversation' : 'Async Recording'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brandBody">Submission status:</span>
              <span className="text-brandSuccess font-extrabold uppercase flex items-center space-x-1">
                <span>Success</span>
              </span>
            </div>
          </div>

          {/* Action trigger */}
          <div className="w-full pt-2">
            <Button
              onClick={() => navigate('/candidate')}
              variant="primary"
              className="w-full py-3"
              icon={Home}
            >
              Return to Dashboard
            </Button>
          </div>

        </CardBody>
      </Card>

    </div>
  );
};
