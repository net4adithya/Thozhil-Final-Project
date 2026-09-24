import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Mic, Volume2, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BrandLoader } from '../components/common/BrandLoader';
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
      <div className="flex-grow flex items-center justify-center py-24">
        <BrandLoader message="Initializing video capture pipeline..." subMessage="Calibrating camera feed & microphone frequency response" />
      </div>
    );
  }

  const handleEnterRoom = () => {
    navigate(`/candidate/room/${candidate.id}`);
  };

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left font-sans text-slate-900">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/candidate')}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 space-x-1 w-fit select-none"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to dashboard</span>
      </button>

      {/* Main Title Banner */}
      <div className="select-none">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Media Stream Setup</h1>
        <p className="text-sm text-slate-500">Configure camera, verify audio frequencies, and review assessment rules.</p>
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between text-xs select-none">
              <span className="font-semibold text-slate-900">Microphone Sensitivity Check</span>
              <button
                type="button"
                onClick={() => micActive && setTestingVoice(!testingVoice)}
                disabled={!micActive}
                className={`font-semibold hover:underline disabled:opacity-40 disabled:no-underline text-blue-600`}
              >
                {testingVoice ? 'Stop Test' : 'Test Microphone'}
              </button>
            </div>

            <VoiceWaveform isActive={testingVoice && micActive} />
          </div>
        </div>

        {/* Right Column: Assessment rules details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Assessment Instructions</span>
              </h3>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed space-y-4">
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">1</span>
                <p>This assessment contains <span className="font-semibold text-slate-900">{interview?.questions?.length || 5} questions</span> targeting core technical skills.</p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">2</span>
                <p>Each question has an individual answering time limit. The timer resets dynamically on each question.</p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">3</span>
                <p>Once you enter the interview room, the assessment is protected. Do not reload or minimize the window tab.</p>
              </div>
            </div>
          </div>

          {/* Proceed control */}
          <div className="select-none">
            <Button
              onClick={handleEnterRoom}
              variant="primary"
              size="lg"
              className="w-full py-3"
              icon={ArrowRight}
              iconPosition="right"
            >
              Enter Interview Room
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AsyncInterview;
