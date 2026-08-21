import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Mic, Volume2, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CameraFeed } from '../components/common/CameraFeed';
import { VoiceWaveform } from '../components/common/VoiceWaveform';

export const AsyncInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [testingVoice, setTestingVoice] = useState(false);

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

  if (loading || !candidate) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleEnterRoom = () => {
    navigate(`/candidate/room/${candidate.id}`);
  };

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/candidate')}
        className="inline-flex items-center text-xs font-semibold text-brandBody hover:text-brandHeading space-x-1 w-fit select-none"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to dashboard</span>
      </button>

      {/* Main Title Banner */}
      <div className="select-none">
        <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Media Stream Setup</h1>
        <p className="text-sm text-brandBody">Configure camera, verify audio frequencies, and review assessment rules.</p>
      </div>

      {/* Dual Column grid splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Webcam view */}
        <div className="space-y-4">
          <CameraFeed cameraActive={camActive} muted={!micActive} isRecording={false} />
          
          {/* Toggle controls */}
          <div className="grid grid-cols-2 gap-4 select-none">
            <Button
              onClick={() => setCamActive(!camActive)}
              variant={camActive ? 'secondary' : 'primary'}
              size="sm"
              icon={Camera}
            >
              {camActive ? 'Disable Cam' : 'Enable Cam'}
            </Button>
            <Button
              onClick={() => setMicActive(!micActive)}
              variant={micActive ? 'secondary' : 'primary'}
              size="sm"
              icon={Mic}
            >
              {micActive ? 'Mute Mic' : 'Unmute Mic'}
            </Button>
          </div>

          {/* Voice Waveform test area */}
          <Card>
            <CardBody className="p-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs select-none">
                <span className="font-semibold text-brandHeading">Microphone Sensitivity Check</span>
                <button
                  type="button"
                  onClick={() => micActive && setTestingVoice(!testingVoice)}
                  disabled={!micActive}
                  className={`font-semibold hover:underline disabled:opacity-40 disabled:no-underline text-primary`}
                >
                  {testingVoice ? 'Stop Test' : 'Test Microphone'}
                </button>
              </div>

              <VoiceWaveform isActive={testingVoice && micActive} />
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Assessment rules details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-brandHeading flex items-center space-x-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                <span>Assessment Instructions</span>
              </h3>
            </CardHeader>
            <CardBody className="p-5 text-xs text-brandBody leading-relaxed space-y-4">
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-gray-150 flex items-center justify-center text-brandHeading font-bold shrink-0">1</span>
                <p>This assessment contains <span className="font-semibold text-brandHeading">{interview?.questions?.length || 5} questions</span> targeting Core engineering/product skills.</p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-gray-150 flex items-center justify-center text-brandHeading font-bold shrink-0">2</span>
                <p>Each question has an individual answering time limit (e.g. 180 seconds). The exam timer resets dynamically on each question.</p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-gray-150 flex items-center justify-center text-brandHeading font-bold shrink-0">3</span>
                <p>Once you click "Enter Interview Room", the assessment is locked and you must complete it in a single sitting. Do not reload or minimize the window tab.</p>
              </div>
            </CardBody>
          </Card>

          {/* Proceed control */}
          <div className="select-none">
            <Button
              onClick={handleEnterRoom}
              variant="primary"
              className="w-full py-3"
              disabled={!camActive || !micActive}
              icon={ArrowRight}
              iconPosition="right"
            >
              Enter Interview Room
            </Button>
            {!camActive && (
              <p className="text-[10px] text-brandDanger mt-2 text-center font-medium">
                You must enable camera and microphone access before entering.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
