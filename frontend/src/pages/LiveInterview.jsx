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
  RefreshCw,
  Maximize2,
  Minimize2,
  CircleDot
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
import { useLiveInterviewSession, LIVE_STATES } from '../hooks/useLiveInterviewSession';
import { useInterviewRecording, RECORDING_STATES } from '../hooks/useInterviewRecording';
import { useProctoringObserver } from '../hooks/useProctoringObserver';

export const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, showToast, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);

  // Workflow & Diagnostics
  const [started, setStarted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [manualAnswerText, setManualAnswerText] = useState('');
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [localAudioProcessing, setLocalAudioProcessing] = useState(false);

  const answerMediaRecorderRef = useRef(null);
  const answerAudioChunksRef = useRef([]);
  const transcriptEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const speakerMutedRef = useRef(speakerMuted);

  useEffect(() => {
    speakerMutedRef.current = speakerMuted;
  }, [speakerMuted]);

  // Handle Sarvam Voice TTS Audio Playback
  const handleAiSpeakingPlayback = useCallback(async (data) => {
    const { phrase, phraseType } = data;
    if (!phrase) return;

    if (speakerMutedRef.current) {
      setTimeout(() => {
        liveSession.notifyFinishedSpeaking(phraseType);
      }, 1500);
      return;
    }

    try {
      const result = await voiceService.synthesizeSpeech(phrase, { speaker: 'meera' });
      if (result?.audioBase64) {
        const audio = await voiceService.playAudioFromBase64(result.audioBase64, result.format || 'audio/wav');
        currentAudioRef.current = audio;
        audio.onended = () => {
          liveSession.notifyFinishedSpeaking(phraseType);
        };
      } else {
        throw new Error('No audio returned from synthesis');
      }
    } catch (err) {
      console.warn('[LiveInterview] Sarvam TTS playback notice, using speech synthesis fallback:', err.message);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.onend = () => {
          liveSession.notifyFinishedSpeaking(phraseType);
        };
        utterance.onerror = () => {
          liveSession.notifyFinishedSpeaking(phraseType);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          liveSession.notifyFinishedSpeaking(phraseType);
        }, 3000);
      }
    }
  }, []);

  // Initialize Real-Time Live Session Hook (WebSocket Gateway)
  const liveSession = useLiveInterviewSession({
    interviewId: interview?.id || id,
    candidateId: candidate?.id,
    onAiSpeaking: handleAiSpeakingPlayback,
    onCompleted: async (data) => {
      // Stop interview video recording and finalize upload
      await sessionRecording.stopRecording();
      showToast('Live interview completed and evaluated successfully!', 'success');
      setTimeout(() => {
        navigate(`/candidate/interviews/${id}/completed`);
      }, 1500);
    }
  });

  const {
    connectionStatus,
    sessionState,
    sessionId,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isFollowUp,
    currentAiPhrase,
    transcripts,
    errorMessage,
    connect,
    submitAnswer,
    endSession,
    retryConnection,
    setErrorMessage
  } = liveSession;

  // Initialize Proctoring Observer Hook (Visibility & Fullscreen observation)
  const proctoring = useProctoringObserver({
    interviewId: interview?.id || id,
    candidateId: candidate?.id,
    sessionId,
    onEventLogged: (event) => {
      if (event.eventType === 'TAB_HIDDEN') {
        showToast('Notice: Please keep your interview tab active during the assessment.', 'warning');
      }
    }
  });

  const { isFullscreen, toggleFullscreen, tabSwitchCount } = proctoring;

  // Initialize Continuous Video/Audio Session Recording Hook (Sprint 10)
  const sessionRecording = useInterviewRecording({
    interviewId: interview?.id || id,
    candidateId: candidate?.id,
    sessionId,
    autoUpload: true,
    onUploadSuccess: (meta) => {
      console.log('[LiveInterview] Continuous session recording uploaded successfully:', meta?.publicUrl);
    },
    onUploadFailed: (err) => {
      console.warn('[LiveInterview] Continuous recording upload notice:', err.message);
    }
  });

  const {
    recordingState,
    recordingDuration,
    startRecording: startSessionRecording,
    stopRecording: stopSessionRecording,
    stopAllMediaTracks
  } = sessionRecording;

  // Load Candidate & Interview records
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
    if (!started || endingSession || sessionState === LIVE_STATES.COMPLETED) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [started, endingSession, sessionState]);

  // Auto-start video recording when live session is connected & ready
  useEffect(() => {
    if (started && sessionState === LIVE_STATES.CONNECTED && recordingState === RECORDING_STATES.IDLE) {
      startSessionRecording();
    }
  }, [started, sessionState, recordingState, startSessionRecording]);

  // Clean up all streams and recordings on unmount
  useEffect(() => {
    return () => {
      stopAllMediaTracks();
    };
  }, [stopAllMediaTracks]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Start Assessment trigger
  const handleStartAssessment = () => {
    setStarted(true);
    connect(false);
    startSessionRecording();
  };

  // Start Microphone Recording for single answer turn
  const startMicRecording = async () => {
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      answerAudioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          answerAudioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(answerAudioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecordingAnswer(false);

        // Transcribe via Sarvam STT
        await handleAudioTranscribeAndSubmit(audioBlob);
      };

      recorder.start();
      answerMediaRecorderRef.current = recorder;
      setIsRecordingAnswer(true);
    } catch (err) {
      setErrorMessage(`Microphone access error: ${err.message}. You can also type your response below.`);
      setIsRecordingAnswer(false);
    }
  };

  // Stop Microphone Recording for single answer turn
  const stopMicRecording = () => {
    if (answerMediaRecorderRef.current && isRecordingAnswer) {
      answerMediaRecorderRef.current.stop();
    }
  };

  // Process Transcribed Audio Blob via Sarvam STT
  const handleAudioTranscribeAndSubmit = async (audioBlob) => {
    setLocalAudioProcessing(true);
    try {
      const sttResult = await voiceService.transcribeAudio(audioBlob, 'en-IN');
      const transcriptText = sttResult.transcript || '';
      if (!transcriptText.trim()) {
        setErrorMessage('No clear speech was detected. Please try recording again or type your answer.');
        setLocalAudioProcessing(false);
        return;
      }

      submitAnswer({
        questionId: currentQuestion?.id,
        transcript: transcriptText,
        answerText: transcriptText,
        duration: 60
      });
    } catch (err) {
      console.error('[LiveInterview] STT Transcription Error:', err);
      setErrorMessage('Speech transcription encountered an error. You can type your response manually.');
    } finally {
      setLocalAudioProcessing(false);
    }
  };

  // Submit typed response
  const handleManualAnswerSubmit = () => {
    const cleanAnswer = manualAnswerText.trim();
    if (!cleanAnswer) return;

    setManualAnswerText('');
    submitAnswer({
      questionId: currentQuestion?.id,
      transcript: cleanAnswer,
      answerText: cleanAnswer,
      duration: 60
    });
  };

  // Manual End Assessment
  const handleEndAssessment = async () => {
    setShowEndModal(false);
    setEndingSession(true);
    try {
      await stopSessionRecording();
      endSession();
      showToast('Interview session completed and recording submitted.', 'success');
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
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-white min-h-screen">
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
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest block">Live Real-Time AI Interviewer</span>
              <h1 className="text-xl font-extrabold text-slate-100 leading-snug">Meet Ava, your Live AI Host</h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                Ava is powered by Sarvam STT & TTS, real-time WebSocket state orchestration, and automated session video recording.
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
                <span className="text-slate-400">Real-Time Gateway:</span>
                <span className="font-semibold text-green-400 font-mono">WebSocket Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Session Proctoring:</span>
                <span className="font-semibold text-indigo-400 font-mono">Media & Visibility Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voice Engine:</span>
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

  // --- RENDERING FOLD 2: ACTIVE REAL-TIME LIVE INTERVIEW ROOM ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Reconnecting banner if disconnected */}
      {connectionStatus === 'reconnecting' && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs text-amber-300 z-30">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="font-bold">Connection lost. Reconnecting to live interview session...</span>
          </div>
          <Button size="xs" variant="outline" onClick={retryConnection} className="text-amber-200 border-amber-400/50">
            Retry Now
          </Button>
        </div>
      )}

      {/* Top Session Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3 text-left">
          <div className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
          <div>
            <h2 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
              <span>{interview.title || 'Live Technical Assessment'}</span>
              {isFollowUp && <Badge variant="warning" className="text-[8px]">Follow-Up Question</Badge>}
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              Candidate: {candidate.name} • Session: {sessionId || 'Live'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Continuous Video Recording Badge */}
          {recordingState === RECORDING_STATES.RECORDING && (
            <div className="flex items-center space-x-1.5 bg-red-950/80 border border-red-800/80 px-2.5 py-1.5 rounded-lg select-none">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-red-300">
                REC {formatTimer(recordingDuration)}
              </span>
            </div>
          )}

          {recordingState === RECORDING_STATES.UPLOADING && (
            <div className="flex items-center space-x-1.5 bg-blue-950/80 border border-blue-800/80 px-2.5 py-1.5 rounded-lg select-none">
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              <span className="text-[10px] font-mono font-bold text-blue-300">Storing Video...</span>
            </div>
          )}

          {/* Session Timer */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg select-none">
            <span className="text-xs font-mono font-bold text-primary">{formatTimer(timerSeconds)}</span>
          </div>

          {/* Fullscreen Mode Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Connection Status Badge */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg select-none">
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-brandSuccess' :
              connectionStatus === 'reconnecting' ? 'bg-amber-400 animate-pulse' :
              'bg-red-500'
            }`} />
            <span className="text-[10px] text-slate-300 capitalize font-mono">{connectionStatus}</span>
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
                <Avatar initials="AV" className="border-slate-800" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-200">Ava (AI Interviewer)</h4>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Powered by Sarvam Voice</span>
                </div>
              </div>

              {/* Status Visual Badges */}
              <Badge 
                variant="primary" 
                className={`text-[9px] px-2 py-0.5 font-extrabold uppercase select-none ${
                  sessionState === LIVE_STATES.AI_SPEAKING || sessionState === LIVE_STATES.INTRODUCTION || sessionState === LIVE_STATES.NEXT_QUESTION ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                  sessionState === LIVE_STATES.LISTENING ? 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse' :
                  sessionState === LIVE_STATES.PROCESSING || localAudioProcessing ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' :
                  sessionState === LIVE_STATES.AI_THINKING ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' :
                  sessionState === LIVE_STATES.COMPLETED ? 'bg-green-600/20 text-green-300 border-green-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {sessionState === LIVE_STATES.AI_SPEAKING || sessionState === LIVE_STATES.INTRODUCTION || sessionState === LIVE_STATES.NEXT_QUESTION ? 'Ava Speaking' :
                 sessionState === LIVE_STATES.LISTENING ? 'Your Turn — Listening...' :
                 sessionState === LIVE_STATES.PROCESSING || localAudioProcessing ? 'Transcribing Audio...' :
                 sessionState === LIVE_STATES.AI_THINKING ? 'AI Evaluating Response...' :
                 sessionState === LIVE_STATES.COMPLETED ? 'Session Complete' :
                 'Connecting...'}
              </Badge>
            </div>

            {/* AI Avatar Pulse Graphic */}
            <div className="flex-grow flex flex-col items-center justify-center my-6 z-10">
              <div className="relative flex items-center justify-center">
                
                {/* Visual Speaking Wave ripples */}
                {(sessionState === LIVE_STATES.AI_SPEAKING || sessionState === LIVE_STATES.INTRODUCTION || sessionState === LIVE_STATES.NEXT_QUESTION) && (
                  <>
                    <span className="absolute w-32 h-32 rounded-full border border-primary/20 animate-ping" />
                    <span className="absolute w-24 h-24 rounded-full border border-primary/45 animate-pulse" />
                  </>
                )}
                
                {(sessionState === LIVE_STATES.AI_THINKING || sessionState === LIVE_STATES.PROCESSING || localAudioProcessing) && (
                  <span className="absolute w-24 h-24 rounded-full border border-amber-500/30 animate-spin border-t-transparent" />
                )}

                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl transition-all duration-300 ${
                  sessionState === LIVE_STATES.AI_SPEAKING || sessionState === LIVE_STATES.INTRODUCTION || sessionState === LIVE_STATES.NEXT_QUESTION ? 'bg-primary shadow-lg shadow-primary/30 scale-105' :
                  sessionState === LIVE_STATES.AI_THINKING || sessionState === LIVE_STATES.PROCESSING ? 'bg-amber-600 shadow-lg shadow-amber-600/30' :
                  sessionState === LIVE_STATES.LISTENING ? 'bg-green-600 shadow-lg shadow-green-600/30 scale-95' :
                  'bg-slate-800'
                }`}>
                  AV
                </div>
              </div>

              {/* Status helper text block */}
              <div className="mt-4 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Live Status</span>
                <p className="text-xs font-bold text-slate-200 mt-0.5">
                  {(sessionState === LIVE_STATES.AI_SPEAKING || sessionState === LIVE_STATES.INTRODUCTION || sessionState === LIVE_STATES.NEXT_QUESTION) && "Ava is speaking question aloud via Sarvam TTS..."}
                  {sessionState === LIVE_STATES.LISTENING && "Your turn! Speak into your microphone or submit text below."}
                  {(sessionState === LIVE_STATES.PROCESSING || localAudioProcessing) && "Transcribing voice capture via Sarvam STT..."}
                  {sessionState === LIVE_STATES.AI_THINKING && "Evaluating technical accuracy & updating real-time session..."}
                  {sessionState === LIVE_STATES.COMPLETED && "Interview completed! Preparing final evaluation report."}
                  {sessionState === LIVE_STATES.CONNECTING && "Establishing real-time WebSocket connection..."}
                </p>
              </div>
            </div>

            {/* Current vocal prompt bubble */}
            <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-xl text-left z-10 select-all">
              <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-500 block mb-1">
                Active Interview Prompt {currentQuestionIndex !== undefined ? `(Q${currentQuestionIndex + 1})` : ''}
              </span>
              <p className="text-xs font-bold text-slate-100 leading-relaxed font-mono">
                "{currentAiPhrase || currentQuestion?.text || 'Initializing real-time session...'}"
              </p>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-left flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                {connectionStatus === 'error' && (
                  <Button size="xs" variant="outline" onClick={retryConnection} className="text-red-300 border-red-500/40">
                    Reconnect
                  </Button>
                )}
              </div>
            )}

            {/* Candidate Speaking & Input Controls */}
            {sessionState === LIVE_STATES.LISTENING && (
              <div className="mt-4 p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Candidate Voice / Text Response</span>
                  <div className="flex items-center space-x-2">
                    {!isRecordingAnswer ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Mic}
                        onClick={startMicRecording}
                        disabled={localAudioProcessing}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleManualAnswerSubmit()}
                    placeholder="Or type your technical answer here..."
                    className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary"
                    disabled={isRecordingAnswer || localAudioProcessing}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Send}
                    onClick={handleManualAnswerSubmit}
                    disabled={!manualAnswerText.trim() || isRecordingAnswer || localAudioProcessing}
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
          
          {/* Candidate camera with live recording overlay */}
          <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-850 shrink-0 select-none">
            <CameraFeed cameraActive={!camOff} muted={micMuted} isRecording={recordingState === RECORDING_STATES.RECORDING} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider text-slate-400 font-bold select-none">
              Candidate Feed
            </div>
            {recordingState === RECORDING_STATES.RECORDING && (
              <div className="absolute top-2 right-2 bg-red-950/90 border border-red-800 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider text-red-300 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>RECORDING</span>
              </div>
            )}
          </div>

          {/* Scrolling Transcript Panel */}
          <Card className="flex-1 bg-slate-900 border-slate-800 flex flex-col overflow-hidden text-left">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Live Transcript Stream</span>
              <Badge variant="primary" className="text-[9px]">Real-Time Sync</Badge>
            </div>
            
            <CardBody className="p-4 flex-grow overflow-y-auto space-y-4 text-xs max-h-[300px] lg:max-h-none">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-20 select-none space-y-2">
                  <FileText className="w-8 h-8 mx-auto" />
                  <p className="font-bold text-[10px]">No transcripts yet</p>
                  <p className="text-[9px] max-w-xs">Speech logs will stream here as conversation progresses.</p>
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
        
        {/* Connection & Proctoring status indicators */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Gateway:</span>
            <span className={`text-[10px] font-bold font-mono ${connectionStatus === 'connected' ? 'text-brandSuccess' : 'text-amber-400'}`}>
              {connectionStatus === 'connected' ? 'WebSocket Active' : 'Connecting...'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Proctoring:</span>
            <span className="text-[10px] font-bold font-mono text-indigo-400">
              {tabSwitchCount > 0 ? `${tabSwitchCount} Tab Change${tabSwitchCount > 1 ? 's' : ''}` : 'Observed'}
            </span>
          </div>
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
              You will complete and submit your live interview assessment and video recording. Are you ready to finalize?
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
                End & Submit
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
