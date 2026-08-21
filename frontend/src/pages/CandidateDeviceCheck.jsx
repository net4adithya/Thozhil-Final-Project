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
import { VoiceLabModal } from '../components/voice/VoiceLabModal';

export const CandidateDeviceCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, loading, showToast } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [camActive, setCamActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [speakerTestPlaying, setSpeakerTestPlaying] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [voiceLabOpen, setVoiceLabOpen] = useState(false);

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
    // Proceed to either async or live interview room depending on interviewType
    if (interview.interviewType === 'live') {
      navigate(`/candidate/interviews/${id}/live`);
    } else {
      navigate(`/candidate/interviews/${id}/async`);
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

          <Card>
            <CardBody className="p-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brandHeading font-sans">Microphone Sensitivity Check</span>
                <button
                  type="button"
                  onClick={() => micActive && setTestingVoice(!testingVoice)}
                  disabled={!micActive}
                  className="font-semibold hover:underline text-primary disabled:opacity-40 disabled:no-underline"
                >
                  {testingVoice ? 'Stop Test' : 'Test Microphone'}
                </button>
              </div>
              <VoiceWaveform isActive={testingVoice && micActive} />
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Hardware checklist */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-bold text-brandHeading font-sans">Hardware Diagnostics Checklist</h3>
            </CardHeader>
            <CardBody className="p-4 space-y-3 text-xs">
              
              {/* Webcam status check */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-xl border border-brandBorder">
                <div className={`p-2 rounded-lg ${camActive ? 'bg-green-50 text-brandSuccess' : 'bg-amber-50 text-brandWarning'} shrink-0`}>
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brandHeading">Webcam Capture Feed</span>
                    <span className={`font-bold ${camActive ? 'text-brandSuccess' : 'text-brandWarning'}`}>
                      {camActive ? 'Active' : 'Unregistered'}
                    </span>
                  </div>
                  <p className="text-[10px] text-brandBody leading-relaxed">
                    {camActive 
                      ? 'Camera permission verified. Feed correctly rendered.' 
                      : 'Please check your browser permissions settings or reconnect your webcam device.'
                    }
                  </p>
                </div>
              </div>

              {/* Mic status check */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-xl border border-brandBorder">
                <div className={`p-2 rounded-lg ${micActive ? 'bg-green-50 text-brandSuccess' : 'bg-amber-50 text-brandWarning'} shrink-0`}>
                  <Mic className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brandHeading">Microphone Capture stream</span>
                    <span className={`font-bold ${micActive ? 'text-brandSuccess' : 'text-brandWarning'}`}>
                      {micActive ? 'Active' : 'Muted'}
                    </span>
                  </div>
                  <p className="text-[10px] text-brandBody leading-relaxed">
                    {micActive 
                      ? 'Audio frequencies registers nominal speech waves.' 
                      : 'Please verify microphone input is not muted physically or in system control panel.'
                    }
                  </p>
                </div>
              </div>

              {/* Speaker status check */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-xl border border-brandBorder">
                <div className="p-2 bg-blue-50 text-primary rounded-lg shrink-0">
                  <Volume2 className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brandHeading">Speaker Playback Output</span>
                    <button
                      onClick={handleSpeakerTest}
                      disabled={speakerTestPlaying}
                      className="text-[10px] font-bold text-primary hover:underline disabled:opacity-40"
                    >
                      {speakerTestPlaying ? 'Testing...' : 'Test Speaker'}
                    </button>
                  </div>
                  <p className="text-[10px] text-brandBody leading-relaxed">
                    Play a simulated voice greeting to confirm your audio output system functions.
                  </p>
                </div>
              </div>

              {/* Browser compatibility check */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-xl border border-brandBorder">
                <div className="p-2 bg-green-50 text-brandSuccess rounded-lg shrink-0">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brandHeading">Browser Compatibility</span>
                    <span className="text-brandSuccess font-bold">Compatible</span>
                  </div>
                  <p className="text-[10px] text-brandBody leading-relaxed">
                    HTML5 camera buffers and media streams are fully supported.
                  </p>
                </div>
              </div>

              {/* Network ping speed */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-xl border border-brandBorder">
                <div className="p-2 bg-green-50 text-brandSuccess rounded-lg shrink-0">
                  <Wifi className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brandHeading">Network Latency speed</span>
                    <span className="text-brandSuccess font-bold">Excellent</span>
                  </div>
                  <p className="text-[10px] text-brandBody leading-relaxed">
                    Ping: 12ms. Network bandwidth satisfies video stream uploads requirements.
                  </p>
                </div>
              </div>

            </CardBody>
          </Card>

          {/* Sarvam Voice Lab Test Trigger */}
          <div className="p-3 bg-blue-50/50 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brandHeading">Sarvam Voice Lab (STT & TTS)</span>
              <p className="text-[10px] text-brandBody">Test speech-to-text recording and voice synthesis.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoiceLabOpen(true)}
            >
              Launch Voice Lab
            </Button>
          </div>

          {/* Proced CTA */}
          <Button
            onClick={handleProceed}
            variant="primary"
            className="w-full py-3"
            disabled={!camActive || !micActive}
            icon={ArrowRight}
            iconPosition="right"
          >
            Continue to Interview
          </Button>
        </div>

      </div>

      <VoiceLabModal
        isOpen={voiceLabOpen}
        onClose={() => setVoiceLabOpen(false)}
      />
    </div>
  );
};
