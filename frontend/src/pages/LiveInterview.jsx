import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText,
  Square,
  Play,
  Send,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { CameraFeed } from '../components/common/CameraFeed';
import { interviewService } from '../services/interviewService';
import { candidateService } from '../services/candidateService';
import { voiceService } from '../services/voiceService';

export const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, submitCandidateAnswers, showToast, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);

  // Workflow & Diagnostics
  const [started, setStarted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // State Machine: 'INITIALIZING' | 'INTRODUCTION' | 'ASKING' | 'LISTENING' | 'TRANSCRIBING' | 'EVALUATING' | 'FOLLOW_UP' | 'NEXT_QUESTION' | 'COMPLETED' | 'ERROR'
  const [sessionState, setSessionState] = useState('INITIALIZING');
  const [liveSession, setLiveSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [currentAiPhrase, setCurrentAiPhrase] = useState('');
  const [transcripts, setTranscripts] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [manualAnswerText, setManualAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittingTurn, setSubmittingTurn] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptEndRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Load Candidate & Interview
  useEffect(() => {
    const loadSessionData = async () => {
      if (!id) return;
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
        console.error('Failed to load live session data:', err);
      }
    };

    if (!loading) {
      loadSessionData();
    }
  }, [id, candidates, interviews, loading, navigate]);

  // Elapsed timer hook
  useEffect(() => {
    if (!started || endingSession || sessionState === 'COMPLETED') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [started, endingSession, sessionState]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Helper to speak AI text aloud via Sarvam TTS with browser speech fallback
  const speakAIPhrase = useCallback(async (phraseText, onFinished) => {
    setCurrentAiPhrase(phraseText);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscripts((prev) => [...prev, { speaker: 'Ava (AI Interviewer)', text: phraseText, timestamp }]);

    if (speakerMuted) {
      if (onFinished) onFinished();
      return;
    }

    try {
      const result = await voiceService.synthesizeSpeech(phraseText, { speaker: 'meera' });
      if (result?.audioBase64) {
        const audio = await voiceService.playAudioFromBase64(result.audioBase64, result.format || 'audio/wav');
        currentAudioRef.current = audio;
        audio.onended = () => {
          if (onFinished) onFinished();
        };
      } else {
        throw new Error('No audio returned from synthesis');
      }
    } catch (err) {
      console.warn('Sarvam TTS playback fallback:', err.message);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phraseText);
        utterance.onend = () => {
          if (onFinished) onFinished();
        };
        utterance.onerror = () => {
          if (onFinished) onFinished();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          if (onFinished) onFinished();
        }, 3000);
      }
    }
  }, [speakerMuted]);

  // Initialize Live Session
  const handleStartAssessment = async () => {
    try {
      setStarted(true);
      setSessionState('INITIALIZING');
      const session = await interviewService.initLiveSession(interview?.id || id, candidate?.id);
      setLiveSession(session);
      setCurrentQuestion(session.currentQuestion);
      setCurrentQuestionIndex(session.currentQuestionIndex || 0);

      // Speak Introduction
      setSessionState('INTRODUCTION');
      await speakAIPhrase(session.introPhrase, () => {
        // Move to first question
        askQuestion(session.currentQuestion, 0, false);
      });
    } catch (err) {
      console.error('Failed to initialize live session:', err);
      setErrorMessage('Failed to connect to Live Interview service.');
      setSessionState('ERROR');
    }
  };

  // Ask Question
  const askQuestion = (question, index, followUp = false) => {
    if (!question) return;
    setSessionState('ASKING');
    setIsFollowUp(followUp);
    setCurrentQuestion(question);
    setCurrentQuestionIndex(index);
    setManualAnswerText('');

    const questionPhrase = followUp 
      ? question.text
      : `Question ${index + 1}: ${question.text}`;

    speakAIPhrase(questionPhrase, () => {
      setSessionState('LISTENING');
    });
  };

  // Start Microphone Recording
  const startMicRecording = async () => {
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        // Transcribe via Sarvam STT
        await handleAudioTranscribeAndSubmit(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setErrorMessage(`Microphone access error: ${err.message}. You can also type your response below.`);
      setIsRecording(false);
    }
  };

  // Stop Microphone Recording
  const stopMicRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Process Transcribed Audio Blob
  const handleAudioTranscribeAndSubmit = async (audioBlob) => {
    setSessionState('TRANSCRIBING');
    try {
      const sttResult = await voiceService.transcribeAudio(audioBlob, 'en-IN');
      const transcriptText = sttResult.transcript || '';
      if (!transcriptText.trim()) {
        setErrorMessage('No speech was detected. Please try recording again or type your answer.');
        setSessionState('LISTENING');
        return;
      }

      await handleAnswerSubmit(transcriptText);
    } catch (err) {
      console.error('STT Transcription Error:', err);
      setErrorMessage('Speech transcription failed. You can type your response manually.');
      setSessionState('LISTENING');
    }
  };

  // Process Turn Submission
  const handleAnswerSubmit = async (answerTextContent) => {
    const cleanAnswer = (answerTextContent || manualAnswerText).trim();
    if (!cleanAnswer || submittingTurn) return;

    setSubmittingTurn(true);
    setSessionState('EVALUATING');
    setErrorMessage('');

    // Append candidate answer to transcript
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscripts((prev) => [...prev, { speaker: 'You (Candidate)', text: cleanAnswer, timestamp }]);
    setManualAnswerText('');

    try {
      const turnPayload = {
        candidateId: candidate?.id,
        questionId: currentQuestion?.id,
        transcript: cleanAnswer,
        answerText: cleanAnswer,
        duration: 60,
        followUpCount,
        isFollowUp,
        currentQuestionIndex
      };

      const result = await interviewService.processLiveTurn(interview?.id || id, turnPayload);

      if (result.nextAction === 'FOLLOW_UP') {
        setFollowUpCount((prev) => prev + 1);
        askQuestion(result.followUpQuestion, currentQuestionIndex, true);
      } else if (result.nextAction === 'NEXT_QUESTION') {
        setFollowUpCount(0);
        askQuestion(result.nextQuestion, result.nextQuestionIndex, false);
      } else if (result.nextAction === 'COMPLETE') {
        setSessionState('COMPLETED');
        const endPhrase = result.message || 'You have completed all live assessment questions. Thank you!';
        await speakAIPhrase(endPhrase, async () => {
          await handleEndAssessment();
        });
      }
    } catch (err) {
      console.error('Live turn processing failed:', err);
      setErrorMessage('Failed to evaluate answer. Please try submitting again.');
      setSessionState('LISTENING');
    } finally {
      setSubmittingTurn(false);
    }
  };

  const handleEndAssessment = async () => {
    setShowEndModal(false);
    setEndingSession(true);
    try {
      if (interview?.id && candidate?.id) {
        await interviewService.completeLiveSession(interview.id, candidate.id);
      }
      showToast('Live interview completed and evaluated successfully!', 'success');
      navigate(`/candidate/interviews/${id}/completed`);
    } catch (err) {
      console.error('Error ending live assessment:', err);
      navigate(`/candidate/interviews/${id}/completed`);
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

  // --- RENDERING FOLD 1: INTRODUCTION / WELCOME SCREEN ---
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
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest block">Live AI Voice Interviewer</span>
              <h1 className="text-xl font-extrabold text-slate-100 leading-snug">Meet Ava, your Live AI Host</h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                Ava is powered by Sarvam STT & TTS. She will speak role-specific technical questions aloud and transcribe and evaluate your responses in real time.
              </p>
            </div>

            <hr className="border-slate-800 w-full" />

            {/* Stats list */}
            <div className="w-full text-xs space-y-3 bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-400">Position Opening:</span>
                <span className="font-semibold text-slate-200">{interview.jobRole || interview.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate:</span>
                <span className="font-semibold text-slate-200">{candidate.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Audio Engine:</span>
                <span className="font-semibold text-primary">Sarvam AI (STT / TTS)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Duration:</span>
                <span className="font-semibold text-slate-200">{interview.duration || 30} mins</span>
              </div>
            </div>

            <Button
              onClick={handleStartAssessment}
              variant="primary"
              className="w-full py-3 text-sm font-bold shadow-lg shadow-primary/20"
              icon={Sparkles}
              size="lg"
            >
              Start Live Interview with Ava
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // --- RENDERING FOLD 2: ACTIVE LIVE INTERVIEW ROOM ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Top Session Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <div>
            <h2 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
              <span>{interview.title || 'Live Technical Assessment'}</span>
              {isFollowUp && <Badge variant="warning" className="text-[8px]">Follow-Up</Badge>}
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              Candidate: {candidate.name} • Session Active
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg select-none">
            <span className="text-xs font-mono font-bold text-primary">{formatTimer(timerSeconds)}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg select-none">
            <span className="w-2 h-2 rounded-full bg-brandSuccess" />
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
                  <h4 className="text-xs font-bold text-slate-200">Ava (AI Interviewer)</h4>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Powered by Sarvam Voice</span>
                </div>
              </div>

              {/* Status Visual Badges */}
              <Badge 
                variant="primary" 
                className={`text-[9px] px-2 py-0.5 font-extrabold uppercase select-none ${
                  sessionState === 'ASKING' || sessionState === 'INTRODUCTION' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                  sessionState === 'LISTENING' ? 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse' :
                  sessionState === 'TRANSCRIBING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' :
                  sessionState === 'EVALUATING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {sessionState === 'ASKING' || sessionState === 'INTRODUCTION' ? 'Ava Speaking' :
                 sessionState === 'LISTENING' ? 'Listening...' :
                 sessionState === 'TRANSCRIBING' ? 'Transcribing (Sarvam STT)...' :
                 sessionState === 'EVALUATING' ? 'Evaluating Response...' :
                 sessionState === 'COMPLETED' ? 'Session Complete' :
                 'Standby'}
              </Badge>
            </div>

            {/* AI Avatar Pulse Graphic */}
            <div className="flex-grow flex flex-col items-center justify-center my-6 z-10">
              <div className="relative flex items-center justify-center">
                
                {/* Visual Speaking Wave ripples */}
                {(sessionState === 'ASKING' || sessionState === 'INTRODUCTION') && (
                  <>
                    <span className="absolute w-32 h-32 rounded-full border border-primary/20 animate-ping" />
                    <span className="absolute w-24 h-24 rounded-full border border-primary/45 animate-pulse" />
                  </>
                )}
                
                {(sessionState === 'EVALUATING' || sessionState === 'TRANSCRIBING') && (
                  <span className="absolute w-24 h-24 rounded-full border border-amber-500/30 animate-spin border-t-transparent" />
                )}

                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl transition-all duration-300 ${
                  sessionState === 'ASKING' || sessionState === 'INTRODUCTION' ? 'bg-primary shadow-lg shadow-primary/30 scale-105' :
                  sessionState === 'EVALUATING' || sessionState === 'TRANSCRIBING' ? 'bg-amber-600 shadow-lg shadow-amber-600/30' :
                  sessionState === 'LISTENING' ? 'bg-green-600 shadow-lg shadow-green-600/30 scale-95' :
                  'bg-slate-800'
                }`}>
                  AV
                </div>
              </div>

              {/* Status helper text block */}
              <div className="mt-4 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Ava Status</span>
                <p className="text-xs font-bold text-slate-200 mt-0.5">
                  {(sessionState === 'ASKING' || sessionState === 'INTRODUCTION') && "Speaking question aloud via Sarvam TTS..."}
                  {sessionState === 'LISTENING' && "Ready. Speak into microphone or submit text response below."}
                  {sessionState === 'TRANSCRIBING' && "Transcribing voice capture via Sarvam STT..."}
                  {sessionState === 'EVALUATING' && "Evaluating technical accuracy & persisting to database..."}
                  {sessionState === 'COMPLETED' && "Interview completed! Preparing final scorecard."}
                </p>
              </div>
            </div>

            {/* Current vocal prompt bubble */}
            <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-xl text-left z-10 select-all">
              <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 block mb-1">Active Interview Question</span>
              <p className="text-xs font-bold text-slate-100 leading-relaxed font-mono">
                "{currentAiPhrase || 'Initializing interview session...'}"
              </p>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-left flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Candidate Speaking & Input Controls */}
            {sessionState === 'LISTENING' && (
              <div className="mt-4 p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Candidate Response</span>
                  <div className="flex items-center space-x-2">
                    {!isRecording ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Mic}
                        onClick={startMicRecording}
                        disabled={submittingTurn}
                      >
                        Start Speaking
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Square}
                        onClick={stopMicRecording}
                        className="animate-pulse"
                      >
                        Done Speaking
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualAnswerText}
                    onChange={(e) => setManualAnswerText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                    placeholder="Or type your technical answer here..."
                    className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary"
                    disabled={isRecording || submittingTurn}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Send}
                    onClick={() => handleAnswerSubmit()}
                    disabled={!manualAnswerText.trim() || submittingTurn}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

          </Card>
        </div>

        {/* Right Column: Candidate Camera & Live Transcripts (Spans 5 columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 overflow-hidden">
          
          {/* Candidate camera */}
          <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-850 shrink-0 select-none">
            <CameraFeed cameraActive={!camOff} muted={micMuted} isRecording={isRecording} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider text-slate-400 font-bold select-none">
              Candidate Feed
            </div>
          </div>

          {/* Scrolling Transcript Panel */}
          <Card className="flex-1 bg-slate-900 border-slate-800 flex flex-col overflow-hidden text-left">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Live Transcript Stream</span>
              <Badge variant="primary" className="text-[9px]">Persisted</Badge>
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
                      <span className={`font-bold ${t.speaker.includes('You') ? 'text-primary' : 'text-indigo-400'}`}>
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
        
        {/* Connection status badge */}
        <div className="flex items-center space-x-2">
          <span className="text-[9px] text-slate-400 font-bold uppercase">System Status:</span>
          <span className="text-[10px] text-brandSuccess font-bold font-mono">Live Engine Online</span>
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
              You will complete and submit your live interview assessment. Are you ready to finalize?
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
                End & Evaluate
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Avatar helper
const Avatar = ({ initials, className }) => (
  <div className={`w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 ${className}`}>
    {initials}
  </div>
);

export default LiveInterview;
