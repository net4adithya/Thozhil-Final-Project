import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle,
  HelpCircle,
  Wifi,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { CameraFeed } from '../components/common/CameraFeed';

export const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, submitCandidateAnswers, showToast, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);

  // Workflow Folds
  const [started, setStarted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  // Diagnostics Toggles
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected' | 'connecting' | 'poor' | 'disconnected'

  // Conversation States
  // States: 'AI_IDLE' | 'AI_SPEAKING' | 'LISTENING' | 'CANDIDATE_SPEAKING' | 'THINKING' | 'FOLLOW_UP' | 'COMPLETED'
  const [aiState, setAiState] = useState('AI_IDLE');
  const [currentAiPhrase, setCurrentAiPhrase] = useState('');
  const [transcripts, setTranscripts] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Centralized Simulated Conversation Sequence
  const conversationScript = [
    {
      aiPrompt: "Hello! I am Ava, your Interviewer Host at SearchCorp. I am looking forward to our interview today. To start, can you explain your experience building search indexes?",
      candidateText: "Sure. In my last role, I configured Elasticsearch clusters, optimizing custom token analyzers and filter contexts for low-latency queries."
    },
    {
      aiPrompt: "That's interesting. What was the main trade-off you considered when choosing filter contexts over query contexts?",
      candidateText: "Query contexts calculate sorting scores which is CPU-expensive. Filter contexts bypass scoring entirely and are automatically cached by the engine, which saved us about 30ms on subsequent requests."
    },
    {
      aiPrompt: "Excellent explanation. Let's switch to frontend architectures. How do you decide between Context API and lightweight managers like Zustand?",
      candidateText: "Context API is great for low-frequency updates. Zustand is ideal for high-frequency updates since it uses selector subscriptions, preventing the entire tree from re-rendering on updates."
    },
    {
      aiPrompt: "Makes sense. How would you handle a production layout shift issue caused by dynamically loaded images?",
      candidateText: "I would ensure all images have explicit aspect-ratio attributes or height/width reservations in CSS, preventing page shift during loads."
    }
  ];

  const currentStepRef = useRef(0);
  const transcriptEndRef = useRef(null);

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

  // Elapsed timer hook
  useEffect(() => {
    if (!started || endingSession) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [started, endingSession]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // TTS Helper
  const speakVocalPrompt = (text, onEndCallback) => {
    if ('speechSynthesis' in window && !speakerMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = () => {
        if (onEndCallback) onEndCallback();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if SpeechSynthesis is blocked
      setTimeout(() => {
        if (onEndCallback) onEndCallback();
      }, 5000);
    }
  };

  // Run Conversation Flow
  const triggerNextConversationStep = () => {
    const stepIdx = currentStepRef.current;
    if (stepIdx >= conversationScript.length) {
      setAiState('COMPLETED');
      setCurrentAiPhrase("We have covered all topics for today. You can end the interview whenever you are ready. Thank you!");
      return;
    }

    const currentExchange = conversationScript[stepIdx];
    
    // AI Speaks
    setAiState('AI_SPEAKING');
    setCurrentAiPhrase(currentExchange.aiPrompt);
    
    speakVocalPrompt(currentExchange.aiPrompt, () => {
      // Append AI Question to Transcript
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTranscripts(prev => [...prev, { speaker: 'Ava (Interviewer)', text: currentExchange.aiPrompt, timestamp }]);

      // Transition to listening / candidate speaking
      setAiState('LISTENING');
      
      setTimeout(() => {
        setAiState('CANDIDATE_SPEAKING');
        // Type Candidate response
        let wordIndex = 0;
        const words = currentExchange.candidateText.split(' ');
        let tempText = '';

        const typingTimer = setInterval(() => {
          if (wordIndex < words.length) {
            tempText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
            // Update live speech transcript in placeholder or view
            wordIndex++;
          } else {
            clearInterval(typingTimer);
            // Append Candidate answer to transcript
            setTranscripts(prev => [...prev, { speaker: 'You', text: currentExchange.candidateText, timestamp }]);
            
            // AI Thinking
            setAiState('THINKING');
            
            setTimeout(() => {
              // Iterate step
              currentStepRef.current += 1;
              triggerNextConversationStep();
            }, 2500);
          }
        }, 150);

      }, 1500);

    });
  };

  const handleStartAssessment = () => {
    setStarted(true);
    triggerNextConversationStep();
  };

  const handleEndAssessment = async () => {
    setShowEndModal(false);
    setEndingSession(true);
    try {
      const answersMap = {};
      transcripts.forEach((t, index) => {
        if (t.speaker === 'You') {
          answersMap[`live-ans-${index}`] = t.text;
        }
      });

      await submitCandidateAnswers(candidate.id, answersMap);
      navigate(`/candidate/interviews/${id}/completed`);
    } catch (err) {
      console.error(err);
      showToast('Error ending assessment.', 'danger');
    } finally {
      setEndingSession(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !candidate || !interview) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-white">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  // --- RENDERING FOLD 1: INTRODUCTION SCREEN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none items-center justify-center p-6 text-left">
        <Card className="max-w-xl w-full bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
          <CardBody className="p-8 space-y-6 flex flex-col items-center">
            
            {/* Visual Avatar badge */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center border-2 border-slate-800 shadow-md">
                <Video className="w-10 h-10 text-white animate-pulse" />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-900" />
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest block">Live Interview Assistant</span>
              <h1 className="text-xl font-extrabold text-slate-100 leading-snug">Meet Ava, your Interview Host</h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                Ava will guide you through this assessment. She will ask role-specific questions and evaluate your responses in real-time.
              </p>
            </div>

            <hr className="border-slate-800 w-full" />

            {/* Stats list */}
            <div className="w-full text-xs space-y-3 bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-400">Position Opening:</span>
                <span className="font-semibold text-slate-200">{interview.jobRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Company:</span>
                <span className="font-semibold text-slate-200">{interview.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Conversational Style:</span>
                <span className="font-semibold text-slate-200">Adaptive Dialogue (Follow-up prompts active)</span>
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartAssessment}
              variant="primary"
              className="w-full py-3"
              icon={ArrowRight}
              iconPosition="right"
            >
              Start Live Interview
            </Button>

          </CardBody>
        </Card>
      </div>
    );
  }

  // --- RENDERING FOLD 2: IMMERSIVE LIVE ROOM ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Header bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Video className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="text-left border-l border-slate-800 pl-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Live Interview</span>
            <h2 className="text-xs font-bold text-slate-200 truncate max-w-xs">{interview.title}</h2>
          </div>
        </div>

        {/* Timer & Connection status check */}
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-slate-300">{formatTimer(timerSeconds)}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg select-none">
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-brandSuccess' : 
              connectionStatus === 'poor' ? 'bg-brandWarning' : 'bg-brandDanger'
            }`} />
            <span className="text-[10px] text-slate-300 capitalize">{connectionStatus} Connection</span>
          </div>
        </div>
      </header>

      {/* Main split dashboard content */}
      <main className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden">
        
        {/* Left Column: AI Interviewer Host (Spans 7 columns) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <Card className="flex-grow bg-slate-900 border-slate-800 flex flex-col justify-between p-5 relative overflow-hidden">
            
            {/* Background glowing rings */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.04),transparent_60%)] pointer-events-none" />

            {/* State indicators header */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center space-x-2">
                <Avatar name="Ava Interviewer" initials="AV" size="sm" className="border-slate-800" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-200">Ava (Interviewer Host)</h4>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Interview Host</span>
                </div>
              </div>

              {/* Status Visual Badges */}
              <Badge 
                variant="primary" 
                className={`text-[9px] px-2 py-0.5 font-extrabold uppercase select-none ${
                  aiState === 'AI_SPEAKING' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                  aiState === 'LISTENING' ? 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse' :
                  aiState === 'CANDIDATE_SPEAKING' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  aiState === 'THINKING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {aiState === 'AI_SPEAKING' ? 'Ava Speaking' :
                 aiState === 'LISTENING' ? 'Listening...' :
                 aiState === 'CANDIDATE_SPEAKING' ? 'You Answering' :
                 aiState === 'THINKING' ? 'Ava Thinking...' :
                 'Standby'}
              </Badge>
            </div>

            {/* AI Avatar Pulse Graphic */}
            <div className="flex-grow flex flex-col items-center justify-center my-6 z-10">
              <div className="relative flex items-center justify-center">
                
                {/* Visual Speaking Wave ripples */}
                {aiState === 'AI_SPEAKING' && (
                  <>
                    <span className="absolute w-32 h-32 rounded-full border border-primary/20 animate-ping" />
                    <span className="absolute w-24 h-24 rounded-full border border-primary/45 animate-pulse" />
                  </>
                )}
                
                {aiState === 'THINKING' && (
                  <span className="absolute w-24 h-24 rounded-full border border-amber-500/30 animate-spin border-t-transparent" />
                )}

                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl transition-all duration-300 ${
                  aiState === 'AI_SPEAKING' ? 'bg-primary shadow-lg shadow-primary/30 scale-105' :
                  aiState === 'THINKING' ? 'bg-amber-600 shadow-lg shadow-amber-600/30' :
                  aiState === 'LISTENING' || aiState === 'CANDIDATE_SPEAKING' ? 'bg-green-600 shadow-lg shadow-green-600/30 scale-95' :
                  'bg-slate-800'
                }`}>
                  AV
                </div>
              </div>

              {/* Status helper text block */}
              <div className="mt-4.5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Ava status</span>
                <p className="text-xs font-bold text-slate-200 mt-0.5">
                  {aiState === 'AI_SPEAKING' && "Speaking prompt aloud..."}
                  {aiState === 'LISTENING' && "Ready. Speak into microphone now."}
                  {aiState === 'CANDIDATE_SPEAKING' && "Transcribing voice answers..."}
                  {aiState === 'THINKING' && "Evaluating responses parameters..."}
                  {aiState === 'AI_IDLE' && "Standby"}
                </p>
              </div>
            </div>

            {/* Current vocal prompt bubble */}
            <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-xl text-left z-10 select-all">
              <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 block mb-1">Active Interview Question</span>
              <p className="text-xs font-bold text-slate-100 leading-relaxed font-mono">
                "{currentAiPhrase || 'Standby. Initializing conversation...'}"
              </p>
            </div>

          </Card>
        </div>

        {/* Right Column: Candidate Camera & Live Transcripts (Spans 5 columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 overflow-hidden">
          
          {/* Candidate camera */}
          <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-850 shrink-0 select-none">
            <CameraFeed cameraActive={!camOff} muted={micMuted} isRecording={false} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider text-slate-400 font-bold select-none">
              Webcam Capture Check
            </div>
          </div>

          {/* Scrolling Transcript Panel */}
          <Card className="flex-1 bg-slate-900 border-slate-800 flex flex-col overflow-hidden text-left">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Live Transcript logs</span>
              <Badge variant="primary" className="text-[9px]">Autoscrolling</Badge>
            </div>
            
            <CardBody className="p-4 flex-grow overflow-y-auto space-y-4 text-xs max-h-[300px] lg:max-h-none">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-20 select-none space-y-2">
                  <FileText className="w-8 h-8 mx-auto" />
                  <p className="font-bold text-[10px]">No transcripts yet</p>
                  <p className="text-[9px] max-w-xs">Speech logs will register here as conversation starts.</p>
                </div>
              ) : (
                transcripts.map((t, idx) => (
                  <div key={idx} className="space-y-1.5 leading-normal">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono select-none">
                      <span className={`font-bold ${t.speaker === 'You' ? 'text-primary' : 'text-indigo-400'}`}>
                        {t.speaker}
                      </span>
                      <span>{t.timestamp}</span>
                    </div>
                    <p className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-slate-300 font-mono text-[10px]">
                      {t.text}
                    </p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </CardBody>
          </Card>

        </div>

      </main>

      {/* Footer controls drawer */}
      <footer className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 select-none">
        
        {/* Connection simulation helper selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Simulate Connection:</span>
          <select
            value={connectionStatus}
            onChange={(e) => setConnectionStatus(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded px-2 py-0.5 text-[9px] outline-none font-bold"
          >
            <option value="connected">Excellent Ping</option>
            <option value="poor">Poor (Amber)</option>
            <option value="disconnected">No Connection</option>
          </select>
        </div>

        {/* Media hardware controls */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => setMicMuted(!micMuted)}
            className={`p-2.5 rounded-lg border transition-all ${micMuted
              ? 'bg-brandDanger border-brandDanger text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {micMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={() => setCamOff(!camOff)}
            className={`p-2.5 rounded-lg border transition-all ${camOff
              ? 'bg-brandDanger border-brandDanger text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={camOff ? 'Enable camera stream' : 'Disable camera stream'}
          >
            {camOff ? <VideoOff className="w-4.5 h-4.5" /> : <Video className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={() => setSpeakerMuted(!speakerMuted)}
            className={`p-2.5 rounded-lg border transition-all ${speakerMuted
              ? 'bg-brandDanger border-brandDanger text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={speakerMuted ? 'Enable speaker voice' : 'Mute speaker voice'}
          >
            {speakerMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* End Call Button */}
        <Button
          onClick={() => setShowEndModal(true)}
          variant="danger"
          size="sm"
          className="bg-brandDanger hover:bg-red-700 text-white"
          icon={PhoneOff}
        >
          End Interview
        </Button>
      </footer>

      {/* Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[9999] select-none text-left p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-slate-100 shadow-xl">
            <div className="flex items-center space-x-2 text-brandDanger">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">End Interview Assessment?</h4>
            </div>
            
            <p className="text-xs text-slate-400 leading-normal">
              You will not be able to continue or resume this assessment session after ending it. Are you sure you want to finalize now?
            </p>

            <div className="flex space-x-3.5 pt-2 select-none">
              <Button
                onClick={() => setShowEndModal(false)}
                variant="ghost"
                className="flex-1 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800"
                size="sm"
              >
                Continue Interview
              </Button>
              <Button
                onClick={handleEndAssessment}
                variant="danger"
                className="flex-1 bg-brandDanger hover:bg-red-700 text-white"
                size="sm"
                loading={endingSession}
              >
                End Interview
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Placeholder Avatar helper
const Avatar = ({ initials, className }) => (
  <div className={`w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 ${className}`}>
    {initials}
  </div>
);
