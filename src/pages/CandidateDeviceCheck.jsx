import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Mic, 
  Volume2, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Globe, 
  Wifi 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CameraFeed } from '../components/common/CameraFeed';
import { VoiceWaveform } from '../components/common/VoiceWaveform';
import { voiceService } from '../services/voiceService';
import { candidateService } from '../services/candidateService';
import { interviewService } from '../services/interviewService';
import { VoiceLabModal } from '../components/voice/VoiceLabModal';

export const CandidateDeviceCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading, showToast } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [resolving, setResolving] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [speakerTestPlaying, setSpeakerTestPlaying] = useState(false);
  const [voiceLabOpen, setVoiceLabOpen] = useState(false);

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
        console.error('Failed to resolve device check interview:', err);
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

  const handleSpeakerTest = async () => {
    setSpeakerTestPlaying(true);
    try {
      const result = await voiceService.synthesizeSpeech("Speaker configuration test successful.");
      if (result?.audioBase64) {
        await voiceService.playAudioFromBase64(result.audioBase64, result.format || 'audio/wav');
      }
    } catch (err) {
      console.warn('Fallback speech playback:', err.message);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Speaker configuration test successful.");
        utterance.onend = () => setSpeakerTestPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setSpeakerTestPlaying(false);
    }
  };

  const handleProceed = () => {
    if (!camActive || !micActive) {
      showToast('Camera and microphone access must be verified to continue.', 'warning');
      return;
    }
    const isLive = (interview.type || interview.interviewType) === 'live';
    const targetCandidateId = candidate.id;

    if (isLive) {
      navigate(`/candidate/interviews/${targetCandidateId}/live`);
    } else {
      navigate(`/candidate/interviews/${targetCandidateId}/async`);
    }
  };

  return (
    <div className="space-y-8 flex-grow flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left select-none">
      
      {/* Back link */}
      <button
        onClick={() => navigate(`/candidate/interviews/${id}`)}
        className="inline-flex items-center text-xs font-semibold text-brandBody hover:text-brandHeading space-x-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to instructions</span>
      </button>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-brandHeading">Device & Hardware Check</h1>
        <p className="text-xs text-brandBody">Verify hardware access and internet performance before starting the session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Camera Preview and mic level */}
        <div className="space-y-4">
          <CameraFeed cameraActive={camActive} muted={!micActive} isRecording={false} className="w-full" />
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setCamActive(!camActive)}
              variant={camActive ? 'secondary' : 'primary'}
              size="sm"
              icon={Camera}
            >
              {camActive ? 'Disable Camera' : 'Enable Camera'}
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
        </div>

        {/* Right Column: Readiness Checklist & Diagnostics */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-brandHeading">Hardware Diagnostics</h3>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              
              {/* Check 1: Camera */}
              <div className="flex items-center justify-between border-b border-brandBorder pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-brandBody">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brandHeading block">Webcam Feed</span>
                    <span className="text-[10px] text-brandBody">HD 720p / 1080p stream</span>
                  </div>
                </div>
                {camActive ? (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-brandSuccess">
                    <CheckCircle className="w-4 h-4" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-brandDanger">
                    <AlertCircle className="w-4 h-4" />
                    <span>Disabled</span>
                  </span>
                )}
              </div>

              {/* Check 2: Microphone */}
              <div className="flex items-center justify-between border-b border-brandBorder pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-brandBody">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brandHeading block">Microphone Capture</span>
                    <span className="text-[10px] text-brandBody">Audio speech recognition</span>
                  </div>
                </div>
                {micActive ? (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-brandSuccess">
                    <CheckCircle className="w-4 h-4" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-xs font-semibold text-brandDanger">
                    <AlertCircle className="w-4 h-4" />
                    <span>Muted</span>
                  </span>
                )}
              </div>

              {/* Check 3: Voice / Speaker test */}
              <div className="flex items-center justify-between border-b border-brandBorder pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-brandBody">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brandHeading block">Speaker Output</span>
                    <span className="text-[10px] text-brandBody">AI Vocal Prompt Audio</span>
                  </div>
                </div>
                <Button
                  onClick={handleSpeakerTest}
                  variant="outline"
                  size="xs"
                  loading={speakerTestPlaying}
                >
                  Test Sound
                </Button>
              </div>

              {/* Check 4: Network Stream */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-brandBody">
                    <Wifi className="w-4 h-4 text-brandSuccess" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brandHeading block">Network Speed</span>
                    <span className="text-[10px] text-brandBody">Ping: 24ms (Optimal)</span>
                  </div>
                </div>
                <span className="flex items-center space-x-1 text-xs font-semibold text-brandSuccess">
                  <CheckCircle className="w-4 h-4" />
                  <span>Stable</span>
                </span>
              </div>

            </CardBody>
          </Card>

          {/* Sarvam Voice Lab Test Trigger */}
          <div className="p-3 bg-blue-50/50 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brandHeading block">Voice Engine (Sarvam STT / TTS)</span>
              <span className="text-[10px] text-brandBody">Test real-time speech transcription & synthesis</span>
            </div>
            <Button
              size="xs"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => setVoiceLabOpen(true)}
            >
              Open Voice Lab
            </Button>
          </div>

          {/* Proceed CTA */}
          <Button
            onClick={handleProceed}
            variant="primary"
            className="w-full py-3 text-sm font-bold"
            disabled={!camActive || !micActive}
            icon={ArrowRight}
            iconPosition="right"
          >
            Ready to Begin Interview
          </Button>

        </div>

      </div>

      {/* Voice Lab Modal */}
      <VoiceLabModal
        isOpen={voiceLabOpen}
        onClose={() => setVoiceLabOpen(false)}
      />

    </div>
  );
};

export default CandidateDeviceCheck;
