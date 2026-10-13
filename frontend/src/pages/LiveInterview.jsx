import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  CheckCircle2,
  HelpCircle,
  Wifi,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Square,
  Play,
  Send,
  Loader2,
  RefreshCw,
  Maximize2,
  Minimize2,
  CircleDot,
  Radio,
  Eye,
  Code2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { BrandLoader } from '../components/common/BrandLoader';
import { AiInterviewerAvatar } from '../components/common/AiInterviewerAvatar';
import { Waveform } from '../components/ui/Waveform';
import { interviewService } from '../services/interviewService';
import { candidateService } from '../services/candidateService';
import { voiceService } from '../services/voiceService';
import { CameraFeed } from '../components/common/CameraFeed';
import { useLiveInterviewSession, LIVE_STATES } from '../hooks/useLiveInterviewSession';
import { useInterviewRecording, RECORDING_STATES } from '../hooks/useInterviewRecording';
import { useProctoringObserver } from '../hooks/useProctoringObserver';
import { ProctorShield } from '../components/proctoring/ProctorShield';
import { CodingIDE } from '../components/common/CodingIDE';

export const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, showToast, refreshData, loading, updateCandidate } = useApp();

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
  const [liveSpeechTranscript, setLiveSpeechTranscript] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [localAudioProcessing, setLocalAudioProcessing] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState('transcript'); // 'transcript' | 'editor'
  const [liveCode, setLiveCode] = useState('');
  const [liveCodeLanguage, setLiveCodeLanguage] = useState('javascript');
  const [candidateCodeSubmissions, setCandidateCodeSubmissions] = useState({});

  const answerMediaRecorderRef = useRef(null);
  const answerAudioChunksRef = useRef([]);
  const transcriptEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const speakerMutedRef = useRef(speakerMuted);
  const notifyFinishedSpeakingRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSubmittingTurnRef = useRef(false);
  const sharedCameraStreamRef = useRef(null);

  // Centralized voice and speech synthesis audio teardown
  const stopAllVoiceAudio = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
        currentAudioRef.current = null;
      } catch (e) {}
    }
    voiceService.stopAllPlayback();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    speakerMutedRef.current = speakerMuted;
    if (speakerMuted) {
      stopAllVoiceAudio();
    }
  }, [speakerMuted, stopAllVoiceAudio]);

  // Teardown all voice audio on unmount or navigation away
  useEffect(() => {
    return () => {
      stopAllVoiceAudio();
    };
  }, [stopAllVoiceAudio]);

  // Extract and normalize interview language settings
  const interviewLanguage = useMemo(() => {
    const raw = interview?.settings?.language || interview?.language;
    if (typeof raw === 'object' && raw?.code) {
      return {
        code: raw.code || 'en-IN',
        name: raw.name || (raw.code === 'ta-IN' ? 'Tamil' : 'English'),
        mode: raw.mode || 'native'
      };
    }
    if (typeof raw === 'string') {
      if (raw === 'ta-IN' || raw.toLowerCase().includes('tamil')) {
        return {
          code: 'ta-IN',
          name: 'Tamil',
          mode: raw.includes('codemix') ? 'codemix' : 'native'
        };
      }
    }
    return { code: 'en-IN', name: 'English', mode: 'native' };
  }, [interview]);

  // Turn-based audio recording refs for Saaras backend STT
  const turnStreamRef = useRef(null);

  // Handle Voice Audio Playback via Bulbul TTS
  const handleAiSpeakingPlayback = useCallback(async (data) => {
    const { phrase, phraseType } = data;
    if (!phrase) return;

    // Cancel any ongoing audio speech immediately
    stopAllVoiceAudio();

    if (speakerMutedRef.current) {
      setTimeout(() => {
        notifyFinishedSpeakingRef.current?.(phraseType);
      }, 1500);
      return;
    }

    let playedSuccessfully = false;
    const isTamil = interviewLanguage.code === 'ta-IN';
    // Configurable initial Tamil speaker is 'kavitha', English speaker is 'priya'
    const speaker = isTamil 
      ? (interview?.settings?.speaker || 'kavitha') 
      : (interview?.settings?.speaker || 'priya');

    try {
      const result = await voiceService.synthesizeSpeech(phrase, {
        targetLanguageCode: interviewLanguage.code,
        speaker
      });
      if (result?.audioBase64 && result.audioBase64.length > 200) {
        const audio = await voiceService.playAudioFromBase64(result.audioBase64, result.format || 'audio/wav');
        currentAudioRef.current = audio;
        playedSuccessfully = true;

        audio.onended = () => {
          console.log('[LiveInterview] Audio playback completed for:', phraseType);
          notifyFinishedSpeakingRef.current?.(phraseType);
        };
        audio.onerror = (e) => {
          console.warn('[LiveInterview] Audio playback error event:', e);
          notifyFinishedSpeakingRef.current?.(phraseType);
        };
      }
    } catch (err) {
      console.warn('[LiveInterview] Voice synthesis playback notice:', err.message);
    }

    if (!playedSuccessfully) {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = isTamil ? 'ta-IN' : 'en-US';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = isTamil
            ? voices.find((v) => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'))
            : voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Ava'))) || voices.find((v) => v.lang.startsWith('en'));
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onend = () => {
            console.log('[LiveInterview] SpeechSynthesis finished for:', phraseType);
            notifyFinishedSpeakingRef.current?.(phraseType);
          };
          utterance.onerror = (e) => {
            console.warn('[LiveInterview] SpeechSynthesis error:', e);
            notifyFinishedSpeakingRef.current?.(phraseType);
          };
          window.speechSynthesis.speak(utterance);
        } catch (synthErr) {
          console.warn('[LiveInterview] SpeechSynthesis speak exception:', synthErr.message);
          setTimeout(() => {
            notifyFinishedSpeakingRef.current?.(phraseType);
          }, 3000);
        }
      } else {
        setTimeout(() => {
          notifyFinishedSpeakingRef.current?.(phraseType);
        }, 3000);
      }
    }
  }, [stopAllVoiceAudio, interviewLanguage, interview]);

  // Initialize Continuous Video/Audio Session Recording Hook
  const sessionRecording = useInterviewRecording({
    interviewId: interview?.id || id,
    candidateId: candidate?.id,
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

  // Auto-start live session recording when candidate & interview are ready
  useEffect(() => {
    if (candidate && interview && recordingState === RECORDING_STATES.IDLE) {
      startSessionRecording(null, { includeScreen: true }).catch((err) => {
        console.warn('[LiveInterview] Auto start recording note:', err.message);
      });
    }
  }, [candidate, interview, recordingState, startSessionRecording]);

  // Initialize Real-Time Live Session Hook (WebSocket Gateway)
  const liveSession = useLiveInterviewSession({
    interviewId: interview?.id || candidate?.interviewId || candidate?.interview_id || id,
    candidateId: candidate?.id || id,
    onAiSpeaking: handleAiSpeakingPlayback,
    onCompleted: async (data) => {
      // Immediately stop any playing AI audio
      stopAllVoiceAudio();
      // Stop interview video recording and finalize upload
      try {
        await stopSessionRecording();
      } catch (recErr) {
        console.warn('Recording finalize notice:', recErr.message);
      }

      // Persist candidate completion in database and state
      const candId = candidate?.id || id;
      if (candId) {
        try {
          if (typeof updateCandidate === 'function') {
            await updateCandidate(candId, {
              status: 'Completed',
              completionDate: new Date().toISOString().split('T')[0]
            });
          } else {
            await candidateService.updateCandidate(candId, {
              status: 'Completed',
              completionDate: new Date().toISOString().split('T')[0]
            });
          }
          sessionStorage.setItem(`interviewx_completed_${candId}`, 'true');
        } catch (e) {}
      }

      if (interview?.id) {
        try {
          await interviewService.updateInterview(interview.id, { status: 'Completed' });
          sessionStorage.setItem(`interviewx_completed_${interview.id}`, 'true');
        } catch (e) {}
      }

      if (typeof refreshData === 'function') {
        await refreshData().catch(() => {});
      }

      showToast('Live interview completed and evaluated successfully!', 'success');
      setTimeout(() => {
        navigate(`/candidate/interviews/${id}/completed`);
      }, 1500);
    }
  });

  // Keep notification ref synced
  useEffect(() => {
    notifyFinishedSpeakingRef.current = liveSession.notifyFinishedSpeaking;
  }, [liveSession.notifyFinishedSpeaking]);

  const {
    connectionStatus,
    sessionState,
    sessionId,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isFollowUp,
    currentAiPhrase,
    currentPhraseType,
    transcripts,
    errorMessage,
    connect,
    submitAnswer,
    endSession,
    retryConnection,
    setErrorMessage
  } = liveSession;

  // Auto-redirect to completed screen when interview reaches completed state
  useEffect(() => {
    if (sessionState === LIVE_STATES.COMPLETED) {
      stopAllVoiceAudio();
      console.log('[LiveInterview] Interview completed! Preparing redirect to evaluation report...');
      if (typeof refreshData === 'function') {
        refreshData().catch(() => {});
      }
      const timer = setTimeout(() => {
        navigate(`/candidate/interviews/${id}/completed`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [sessionState, id, navigate, refreshData, stopAllVoiceAudio]);

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

  // Load Candidate & Interview records accurately by UUID
  useEffect(() => {
    let isCancelled = false;
    const loadSessionData = async () => {
      if (!id) return;
      try {
        let cand = null;
        let matchInt = null;

        // 1. First check if URL param :id corresponds to a Candidate UUID
        cand = (candidates || []).find((c) => c.id === id);
        if (!cand) {
          cand = await candidateService.getCandidateById(id).catch(() => null);
        }

        if (cand) {
          // Resolved candidate directly from route ID
          const targetIntId = cand.interviewId || cand.interview_id;
          if (targetIntId) {
            matchInt = (interviews || []).find((i) => i.id === targetIntId);
            if (!matchInt) {
              matchInt = await interviewService.getInterviewById(targetIntId).catch(() => null);
            }
          }
          if (!matchInt && interviews?.length > 0) {
            matchInt = interviews.find((i) => i.jobRole === cand.role || i.title === cand.role) || interviews[0];
          }
        } else {
          // 2. Route ID is an Interview UUID
          matchInt = (interviews || []).find((i) => i.id === id);
          if (!matchInt) {
            matchInt = await interviewService.getInterviewById(id).catch(() => null);
          }

          if (matchInt) {
            // Check active candidate matched to interview or from session
            const storedCandId = sessionStorage.getItem('interviewx_active_candidate_id');
            const linkedCandId = matchInt.candidateId || matchInt.candidate_id || matchInt.candidate?.id || storedCandId;
            if (linkedCandId) {
              cand = (candidates || []).find((c) => c.id === linkedCandId) || await candidateService.getCandidateById(linkedCandId).catch(() => null);
            }
            if (!cand) {
              cand = (candidates || []).find((c) => c.interviewId === matchInt.id || c.interview_id === matchInt.id);
            }
          }
        }

        // 3. Fallback candidate ensuring the route's candidate context is preserved
        if (!cand) {
          cand = {
            id: id,
            name: 'Candidate',
            email: '',
            role: matchInt?.jobRole || matchInt?.title || 'Technical Candidate',
            status: 'Ready'
          };
        }

        if (cand?.id) {
          sessionStorage.setItem('interviewx_active_candidate_id', cand.id);
        }

        if (!matchInt) {
          matchInt = {
            id: cand.interviewId || cand.interview_id || 'int-live',
            title: cand.role ? `${cand.role} Assessment` : 'Technical Assessment Session',
            jobRole: cand.role || 'Software Engineer',
            duration: 30,
            type: 'live'
          };
        }

        if (!isCancelled) {
          setCandidate(cand);
          setInterview(matchInt);
        }
      } catch (err) {
        console.error('Failed to load live session data:', err);
      }
    };

    if (!loading) {
      loadSessionData();
    }
    return () => {
      isCancelled = true;
    };
  }, [id, candidates, interviews, loading]);

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
      startSessionRecording(sharedCameraStreamRef.current);
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
    // Unlock browser audio and speech synthesis on user interaction
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.resume(); } catch (e) {}
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const tempCtx = new AudioContextClass();
        tempCtx.resume().then(() => tempCtx.close()).catch(() => {});
      }
    } catch (e) {}

    setStarted(true);
    connect(false);
    startSessionRecording(sharedCameraStreamRef.current);
  };

  // Start turn-based audio recording for authoritative backend transcription
  const startTurnAudioRecording = useCallback(async () => {
    if (isRecordingAnswer || isSubmittingTurnRef.current) return;
    setErrorMessage('');
    try {
      let stream = turnStreamRef.current;
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        turnStreamRef.current = stream;
      }
      answerAudioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          answerAudioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecordingAnswer(false);
        const audioBlob = new Blob(answerAudioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 1500) {
          await handleAudioTranscribeAndSubmit(audioBlob);
        }
      };

      recorder.start(500);
      answerMediaRecorderRef.current = recorder;
      setIsRecordingAnswer(true);
    } catch (err) {
      console.warn('[LiveInterview] Audio recording start notice:', err.message);
    }
  }, [isRecordingAnswer]);

  // Stop turn-based audio recording to trigger backend transcription
  const stopTurnAudioRecording = useCallback(() => {
    if (answerMediaRecorderRef.current && answerMediaRecorderRef.current.state === 'recording') {
      try {
        answerMediaRecorderRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // Real-time speech recognition for interim visual typing feedback only
  // Backend Saaras v3 transcription remains the authoritative source of truth
  useEffect(() => {
    if (sessionState !== LIVE_STATES.LISTENING || micMuted || !started) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch (e) {}
        speechRecognitionRef.current = null;
      }
      stopTurnAudioRecording();
      setIsListeningSpeech(false);
      return;
    }

    // Auto-start turn audio recording when candidate is invited to answer
    startTurnAudioRecording().catch(() => {});

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[LiveInterview] Browser speech visual preview not available; backend audio recording active');
      return;
    }

    let isMounted = true;
    let recognition = null;

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = interviewLanguage.code === 'ta-IN' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        if (isMounted) setIsListeningSpeech(true);
      };

      recognition.onresult = (event) => {
        if (!isMounted || isSubmittingTurnRef.current) return;
        let interim = '';
        let finalStr = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const fullTranscript = (finalStr + interim).trim();
        if (fullTranscript) {
          setLiveSpeechTranscript(fullTranscript);

          // Auto-silence timer: after candidate speaks, 3s pause completes turn via backend audio STT
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          if (fullTranscript.length >= 8) {
            silenceTimerRef.current = setTimeout(() => {
              console.log('[LiveInterview] Silence detected after speech, finalizing turn via backend transcription...');
              stopTurnAudioRecording();
            }, 3000);
          }
        }
      };

      recognition.onerror = (err) => {
        console.warn('[LiveInterview] Speech recognition notice:', err?.error || err);
      };

      recognition.onend = () => {
        if (isMounted && sessionState === LIVE_STATES.LISTENING && !micMuted && !isSubmittingTurnRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        } else if (isMounted) {
          setIsListeningSpeech(false);
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('[LiveInterview] Speech recognition init notice:', err.message);
    }

    return () => {
      isMounted = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognition) {
        try {
          recognition.abort();
        } catch (e) {}
      }
      speechRecognitionRef.current = null;
      setIsListeningSpeech(false);
    };
  }, [sessionState, micMuted, started, interviewLanguage, startTurnAudioRecording, stopTurnAudioRecording]);

  // Submit Spoken or Typed Response
  const handleCandidateSpeechSubmit = (customText) => {
    if (isSubmittingTurnRef.current) return;
    const cleanAnswer = (typeof customText === 'string' ? customText : (manualAnswerText || liveSpeechTranscript)).trim();
    if (!cleanAnswer) return;

    isSubmittingTurnRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.abort(); } catch (e) {}
      speechRecognitionRef.current = null;
    }
    stopTurnAudioRecording();
    setIsListeningSpeech(false);
    setLiveSpeechTranscript('');
    setManualAnswerText('');

    submitAnswer({
      questionId: currentQuestion?.id,
      transcript: cleanAnswer,
      answerText: cleanAnswer,
      duration: 60
    });

    setTimeout(() => {
      isSubmittingTurnRef.current = false;
    }, 1200);
  };

  // Start Manual Microphone Recording for single answer turn
  const startMicRecording = async () => {
    await startTurnAudioRecording();
  };

  // Stop Manual Microphone Recording for single answer turn
  const stopMicRecording = () => {
    stopTurnAudioRecording();
  };

  // Process Transcribed Audio Blob via Authoritative Backend Saaras Transcription
  const handleAudioTranscribeAndSubmit = async (audioBlob) => {
    if (isSubmittingTurnRef.current) return;
    setLocalAudioProcessing(true);
    try {
      const sttResult = await voiceService.transcribeAudio(audioBlob, interviewLanguage.code);
      const transcriptText = (sttResult?.transcript || '').trim();
      if (!transcriptText) {
        setErrorMessage('Speech could not be transcribed clearly. Please speak again or type your answer.');
        setLocalAudioProcessing(false);
        return;
      }

      handleCandidateSpeechSubmit(transcriptText);
    } catch (err) {
      console.error('[LiveInterview] Audio transcription notice:', err.message);
      setErrorMessage('Speech transcription encountered an issue. You can type your response manually.');
    } finally {
      setLocalAudioProcessing(false);
    }
  };

  // Submit typed response
  const handleManualAnswerSubmit = () => {
    stopTurnAudioRecording();
    handleCandidateSpeechSubmit();
  };

  // Intelligent check if current live question is coding-focused
  const isAiCodingQuestion = useMemo(() => {
    if (!currentQuestion) return false;
    const cat = (currentQuestion.category || '').toLowerCase();
    const txt = (currentQuestion.text || '').toLowerCase();
    const role = (interview?.jobRole || interview?.title || '').toLowerCase();

    if (
      cat.includes('cod') ||
      cat.includes('algo') ||
      cat.includes('data struct') ||
      cat.includes('program') ||
      cat.includes('script') ||
      cat.includes('sql') ||
      cat.includes('full stack') ||
      cat.includes('backend') ||
      cat.includes('frontend')
    ) {
      return true;
    }
    const keywords = ['function', 'write a', 'implement', 'algorithm', 'code', 'snippet', 'return', 'array', 'complexity', 'class', 'component', 'sql', 'query', 'database', 'async', 'promise'];
    return keywords.some(kw => txt.includes(kw));
  }, [currentQuestion, interview]);

  // If question changes and it's a coding question, auto switch workspace mode to IDE
  useEffect(() => {
    if (isAiCodingQuestion && currentQuestion?.id) {
      setWorkspaceMode('editor');
    }
  }, [currentQuestion?.id, isAiCodingQuestion]);

  // Handle Code Submission to AI Interviewer
  const handleSubmitCodeToInterviewer = ({ code, language, testResults }) => {
    if (!code || !code.trim()) {
      showToast('Please write code before submitting', 'warning');
      return;
    }

    const currentQId = currentQuestion?.id || `live-q-${currentQuestionIndex}`;
    setCandidateCodeSubmissions((prev) => ({
      ...prev,
      [currentQId]: {
        code,
        language,
        testResults,
        submittedAt: new Date().toISOString()
      }
    }));

    const passedCount = (testResults || []).filter(r => r.passed).length;
    const totalCount = testResults?.length || 0;
    const resultsSummary = totalCount > 0 ? ` (${passedCount}/${totalCount} tests passed)` : '';
    const explanationText = `[Candidate submitted ${language.toUpperCase()} Solution${resultsSummary}]:\n\`\`\`${language}\n${code}\n\`\`\``;

    submitAnswer({
      questionId: currentQuestion?.id,
      transcript: explanationText,
      answerText: explanationText,
      code,
      language,
      testResults,
      duration: 60
    });

    showToast(`Code solution (${language}) submitted to AI interviewer!`, 'success');
  };

  // Manual End Assessment
  const handleEndAssessment = async () => {
    stopAllVoiceAudio();
    setShowEndModal(false);
    setEndingSession(true);
    try {
      await stopSessionRecording();

      // Explicitly update candidate status to Completed in database and AppContext
      const candId = candidate?.id || id;
      if (candId) {
        try {
          if (typeof updateCandidate === 'function') {
            await updateCandidate(candId, {
              status: 'Completed',
              completionDate: new Date().toISOString().split('T')[0]
            });
          } else {
            await candidateService.updateCandidate(candId, {
              status: 'Completed',
              completionDate: new Date().toISOString().split('T')[0]
            });
          }
          sessionStorage.setItem(`interviewx_completed_${candId}`, 'true');
        } catch (candErr) {
          console.warn('[LiveInterview] Candidate update note:', candErr.message);
        }
      }

      if (interview?.id) {
        try {
          await interviewService.updateInterview(interview.id, { status: 'Completed' });
          sessionStorage.setItem(`interviewx_completed_${interview.id}`, 'true');
        } catch (intErr) {
          console.warn('[LiveInterview] Interview update notice:', intErr.message);
        }
      }

      endSession();

      if (typeof refreshData === 'function') {
        await refreshData().catch(() => {});
      }

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
      <BrandLoader 
        message="Connecting to Assessment Workspace..." 
        subtext="Verifying session integrity and hardware channels"
        fullScreen={true} 
      />
    );
  }

  // --- RENDERING FOLD 1: INTRODUCTION / PRE-JOIN ROOM ---
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none items-center justify-center p-6 text-left">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-xl text-slate-900 shadow-sm p-8 space-y-6 flex flex-col items-center">
          
          {/* Header Brand & Avatar */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>InterviewX • Conversational Assessment Track</span>
            </div>
            
            <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Video className="w-8 h-8 stroke-[1.75]" />
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Technical Assessment Session</h1>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Participate in a calibrated, conversational technical evaluation guided by the InterviewX Assessment System.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 w-full" />

          {/* Session Metadata Grid */}
          <div className="w-full text-xs space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Position Opening</span>
              <span className="font-semibold text-slate-900">{interview.jobRole || interview.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Candidate</span>
              <span className="font-semibold text-slate-900">{candidate.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Interview Format</span>
              <span className="font-semibold text-blue-600">Interactive Voice Assessment</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Interview Language</span>
              <span className="font-semibold text-slate-900">
                {interviewLanguage.code === 'ta-IN' 
                  ? (interviewLanguage.mode === 'codemix' ? 'தமிழ் (Tamil + English)' : 'தமிழ் (Tamil)') 
                  : 'English (India)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Session Integrity</span>
              <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected Exam Session</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Allocated Time</span>
              <span className="font-semibold text-slate-900">{interview.duration || 30} minutes</span>
            </div>
          </div>

          <Button
            onClick={handleStartAssessment}
            variant="primary"
            className="w-full py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
            icon={ArrowRight}
            iconPosition="right"
            size="lg"
          >
            Enter Live Interview
          </Button>

        </div>
      </div>
    );
  }

  // --- RENDERING FOLD 2: ACTIVE REAL-TIME TWO-PANEL VIDEO CALL (LIGHT ENTERPRISE THEME) ---
  const isAiSpeaking = sessionState === LIVE_STATES.AI_SPEAKING || sessionState === LIVE_STATES.INTRODUCTION || sessionState === LIVE_STATES.NEXT_QUESTION;
  const isListening = sessionState === LIVE_STATES.LISTENING;
  const isThinking = sessionState === LIVE_STATES.AI_THINKING || sessionState === LIVE_STATES.PROCESSING || localAudioProcessing;

  const handleProctorTerminate = async (violationDetails) => {
    try {
      setEndingSession(true);
      if (typeof endSession === 'function') {
        await endSession();
      }
      showToast(`Assessment terminated: ${violationDetails.reason}`, 'danger');
    } catch (e) {
      console.warn('Auto end notice:', e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Proctoring Shield Enforcement */}
      <ProctorShield
        candidate={candidate}
        interview={interview}
        interviewId={interview?.id || candidate?.interviewId || id}
        candidateId={candidate?.id || id}
        onTerminate={handleProctorTerminate}
        maxViolations={3}
        returnTimeoutSeconds={20}
      />

      {/* Reconnecting banner if disconnected */}
      {connectionStatus === 'reconnecting' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800 z-30">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span className="font-medium">Connection lost. Reconnecting to live interview session...</span>
          </div>
          <Button size="xs" variant="outline" onClick={retryConnection} className="text-amber-800 border-amber-300 rounded-lg">
            Retry Now
          </Button>
        </div>
      )}

      {/* Top Bar Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div className="flex items-center space-x-4 text-left">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-900 tracking-tight">InterviewX AI</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-semibold text-slate-900">
                {interview.title || interview.jobRole || 'Live Technical Assessment'}
              </h2>
              <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                Question {Math.min((currentQuestionIndex || 0) + 1, totalQuestions || 5)} of {totalQuestions || 5}
              </span>
              <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                {interviewLanguage.code === 'ta-IN' 
                  ? (interviewLanguage.mode === 'codemix' ? 'தமிழ் + English' : 'தமிழ்') 
                  : 'English'}
              </span>
              {isFollowUp && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                  Follow-Up
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">
              Candidate: <strong className="text-slate-700">{candidate.name}</strong>
            </span>
          </div>
        </div>

        {/* Status Chips & Proctoring */}
        <div className="flex items-center space-x-2.5">
          {/* Continuous Video Recording Chip */}
          {recordingState === RECORDING_STATES.RECORDING && (
            <div className="flex items-center space-x-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span className="text-xs font-semibold text-red-600">
                REC {formatTimer(recordingDuration)}
              </span>
            </div>
          )}

          {/* Tab Focus Detection Chip */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
            tabSwitchCount > 0 
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Eye className="w-3.5 h-3.5" />
            <span>{tabSwitchCount > 0 ? `${tabSwitchCount} Tab Change${tabSwitchCount > 1 ? 's' : ''}` : 'Screen Focused'}</span>
          </div>

          {/* Session Timer Chip */}
          <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600">
            {formatTimer(timerSeconds)}
          </div>

          {/* Fullscreen Mode Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Two-Panel Call Layout */}
      <main className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden">
        
        {/* Left Panel: AI Interviewer (Ava) Presence */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex-grow bg-white border border-slate-200 rounded-xl flex flex-col justify-between p-6 relative overflow-hidden shadow-xs">
            
            {/* Top Identity & Status Badge Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  IX
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900">Lead Evaluator</h4>
                  <span className="text-[10px] text-slate-500 font-normal">Standardized Assessment</span>
                </div>
              </div>

              {/* Turn-Taking State Badges */}
              <div className="flex items-center space-x-2">
                {isAiSpeaking && (
                  <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold text-blue-700">
                    <Waveform isSpeaking={true} />
                    <span>Interviewer Speaking</span>
                  </div>
                )}
                {isListening && (
                  <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Listening to your response...</span>
                  </div>
                )}
                {isThinking && (
                  <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold text-amber-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>Evaluating Response...</span>
                  </div>
                )}
                {sessionState === LIVE_STATES.COMPLETED && (
                  <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assessment Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Avatar Presence */}
            <div className="flex-grow flex flex-col justify-center my-2 z-10 w-full">
              <AiInterviewerAvatar
                isSpeaking={isAiSpeaking}
                isListening={isListening}
                isThinking={isThinking}
                currentPhrase={currentAiPhrase}
                phraseType={currentPhraseType}
                className="w-full min-h-[220px]"
              />
            </div>

            {/* Active Interview Prompt Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left z-10 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>
                    {currentPhraseType === 'intro'
                      ? 'Interviewer Introduction'
                      : isFollowUp
                        ? `Follow-Up Question (Q${(currentQuestionIndex || 0) + 1})`
                        : `Assessment Question (Q${(currentQuestionIndex || 0) + 1})`}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  Voice Session Synced
                </span>
              </div>
              <p className="text-sm text-slate-900 font-semibold leading-relaxed">
                "{currentAiPhrase || currentQuestion?.text || 'Initializing assessment questions...'}"
              </p>
            </div>

            {/* Session Completed Banner & Action Buttons */}
            {sessionState === LIVE_STATES.COMPLETED && (
              <div className="mt-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-left space-y-3 z-20 shadow-xs">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Interview Completed and Evaluated</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  All candidate responses and session integrity metrics have been securely submitted and evaluated.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={ArrowRight}
                    iconPosition="right"
                    onClick={() => navigate(`/candidate/interviews/${id}/completed`)}
                  >
                    View Submission Summary
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/candidate')}
                    className="bg-white border-slate-200"
                  >
                    Candidate Dashboard
                  </Button>
                </div>
              </div>
            )}

            {/* Error banner if any */}
            {errorMessage && sessionState !== LIVE_STATES.COMPLETED && (
              <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
                <Button size="xs" variant="outline" onClick={retryConnection} className="text-red-700 border-red-200 rounded-lg hover:bg-red-100 shrink-0 ml-2">
                  Retry
                </Button>
              </div>
            )}

            {/* Candidate Response Input Bar (during LISTENING state) */}
            {isListening && (
              <div className="mt-4 p-4 bg-white border border-emerald-300 rounded-xl space-y-3 z-10 shadow-xs">
                {/* Coding Assessment Guidance Banner */}
                {isAiCodingQuestion && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-blue-950">Coding Assessment Question</p>
                        <p className="text-[11px] text-blue-700">Write, test, and submit your code directly in the Coding IDE on the right.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode('editor')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs shrink-0 ${
                        workspaceMode === 'editor'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {workspaceMode === 'editor' ? 'IDE Active 👉' : 'Open Coding IDE 💻'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      {isListeningSpeech ? 'Listening to your voice...' : 'Microphone Active — Speak your response'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isRecordingAnswer ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        icon={Mic}
                        onClick={startMicRecording}
                        disabled={localAudioProcessing}
                      >
                        Push to Speak
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="danger"
                        icon={Square}
                        onClick={stopMicRecording}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg animate-pulse font-semibold"
                      >
                        Done Speaking
                      </Button>
                    )}
                  </div>
                </div>

                {/* Processing audio state */}
                {localAudioProcessing && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2.5 text-xs text-blue-800 shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    <span className="font-semibold">Processing your speech response...</span>
                  </div>
                )}

                {/* Real-time streaming speech preview */}
                {liveSpeechTranscript && !localAudioProcessing && (
                  <div className="p-3 bg-slate-50 border border-emerald-200 rounded-lg text-left shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Speech Preview</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Listening to voice...</span>
                    </div>
                    <p className="text-xs text-slate-800 italic font-medium">
                      "{liveSpeechTranscript}"
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={manualAnswerText}
                    onChange={(e) => {
                      setManualAnswerText(e.target.value);
                      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualAnswerSubmit()}
                    placeholder="Speak naturally or type your answer here..."
                    className="flex-grow bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
                    disabled={localAudioProcessing}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Send}
                    onClick={handleManualAnswerSubmit}
                    disabled={!manualAnswerText.trim() || localAudioProcessing}
                  >
                    Submit Response
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Panel: Candidate Camera & Live Transcript Stream */}
        <div className="lg:col-span-5 flex flex-col space-y-4 overflow-hidden">
          
          {/* Candidate camera feed container */}
          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative border border-slate-200 shrink-0 select-none shadow-xs">
            <CameraFeed
              cameraActive={!camOff}
              muted={micMuted}
              isRecording={recordingState === RECORDING_STATES.RECORDING}
              onStreamReady={(stream) => { sharedCameraStreamRef.current = stream; }}
              className="w-full h-full object-cover"
              showBadges={false}
            />
            
            {/* Top Left: Candidate Stream Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1 rounded-md text-[10px] text-slate-200 font-medium flex items-center space-x-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Candidate Video Stream</span>
            </div>
            
            {/* Top Right: Recording Active Badge */}
            {recordingState === RECORDING_STATES.RECORDING && (
              <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-xs border border-red-500 px-2.5 py-1 rounded-md text-[10px] text-white font-semibold flex items-center space-x-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>REC ACTIVE</span>
              </div>
            )}

            {/* Bottom Left: Candidate Identity & Mic Status */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1 rounded-md text-[10px] text-slate-200 font-medium flex items-center space-x-2 shadow-xs">
              <span className="font-semibold text-white">{candidate?.name || 'Candidate'}</span>
              <span className="text-slate-500">•</span>
              <span className={`flex items-center space-x-1 ${micMuted ? 'text-red-400' : 'text-emerald-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${micMuted ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span>{micMuted ? 'Muted' : 'Mic Active'}</span>
              </span>
            </div>
          </div>

          {/* Workspace Mode Switcher (Transcript vs Coding IDE) */}
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-xs select-none shrink-0">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setWorkspaceMode('transcript')}
                className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  workspaceMode === 'transcript'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Live Transcript</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceMode('editor')}
                className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  workspaceMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Coding IDE</span>
                {isAiCodingQuestion && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500">
              <span className="hidden sm:inline">
                {workspaceMode === 'editor' ? 'Live Execution Sandbox' : 'Synchronized Stream'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Conditional View: Live Coding IDE vs Live Transcript */}
          {workspaceMode === 'editor' ? (
            <div className="flex-1 flex flex-col min-h-[420px] overflow-hidden">
              <CodingIDE
                key={currentQuestion?.id || currentQuestionIndex}
                initialCode={candidateCodeSubmissions[currentQuestion?.id]?.code || currentQuestion?.boilerplate || liveCode || ''}
                language={candidateCodeSubmissions[currentQuestion?.id]?.language || liveCodeLanguage || 'javascript'}
                questionTitle={currentQuestion?.text || 'Live Technical Assessment Question'}
                testCases={(() => {
                  try {
                    if (currentQuestion?.testCases) {
                      return typeof currentQuestion.testCases === 'string'
                        ? JSON.parse(currentQuestion.testCases)
                        : currentQuestion.testCases;
                    }
                    if (currentQuestion?.test_cases) {
                      return typeof currentQuestion.test_cases === 'string'
                        ? JSON.parse(currentQuestion.test_cases)
                        : currentQuestion.test_cases;
                    }
                    return [
                      { input: '"hello"', expected: '"olleh"', description: 'Basic input verification' },
                      { input: '"interview"', expected: '"weivretni"', description: 'Standard string case' }
                    ];
                  } catch {
                    return [];
                  }
                })()}
                onCodeChange={(newCode, newLang) => {
                  setLiveCode(newCode);
                  setLiveCodeLanguage(newLang);
                }}
                onSubmitToInterviewer={handleSubmitCodeToInterviewer}
                className="h-full border border-slate-200 rounded-xl shadow-xs"
              />
            </div>
          ) : (
            /* Live Transcript Stream Card */
            <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden text-left shadow-xs">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between select-none bg-slate-50/50">
                <span className="text-xs font-bold text-slate-900">Live Transcript Stream</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-medium border border-slate-200">
                  Synchronized
                </span>
              </div>
              
              <div className="p-4 flex-grow overflow-y-auto space-y-3.5 text-xs max-h-[320px] lg:max-h-none">
                {transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-16 select-none space-y-2">
                    <FileText className="w-7 h-7 mx-auto text-slate-300" />
                    <p className="font-semibold text-xs text-slate-600">No transcripts recorded yet</p>
                    <p className="text-[10px] text-slate-400 max-w-xs">Speech and code solutions will transcribe and stream here in real time as the conversation progresses.</p>
                  </div>
                ) : (
                  transcripts.map((t, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 select-none">
                        <span className={`font-semibold flex items-center space-x-1 ${t.speaker.includes('You') ? 'text-blue-600' : 'text-slate-900'}`}>
                          {t.isCode && <Code2 className="w-3 h-3 text-blue-600 inline" />}
                          <span>{t.speaker.includes('You') ? 'You (Candidate)' : 'Lead Evaluator'}</span>
                        </span>
                        <span>{t.timestamp}</span>
                      </div>
                      <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                        t.isCode || t.text?.includes('💻 [Submitted')
                          ? 'bg-slate-900 text-emerald-400 font-mono border border-slate-800 whitespace-pre-wrap'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 font-normal'
                      }`}>
                        {t.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Floating Action Bar / Video Call Controls Bottom Bar */}
      <footer className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 select-none shadow-xs">
        
        {/* Session status indicators */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500 font-medium">Session:</span>
            <span className={`text-xs font-semibold ${connectionStatus === 'connected' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {connectionStatus === 'connected' ? 'Connected & Active' : 'Connecting...'}
            </span>
          </div>
          <span className="text-slate-200">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500 font-medium">Integrity:</span>
            <span className="text-xs font-medium text-slate-700">
              {tabSwitchCount > 0 ? `${tabSwitchCount} tab switch${tabSwitchCount > 1 ? 'es' : ''} logged` : 'Focused'}
            </span>
          </div>
        </div>

        {/* Media hardware controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMicMuted(!micMuted)}
            className={`p-3 rounded-lg border transition-colors ${micMuted
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setCamOff(!camOff)}
            className={`p-3 rounded-lg border transition-colors ${camOff
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={camOff ? 'Enable camera stream' : 'Disable camera stream'}
          >
            {camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setSpeakerMuted(!speakerMuted)}
            className={`p-3 rounded-lg border transition-colors ${speakerMuted
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={speakerMuted ? 'Enable speaker' : 'Mute speaker'}
          >
            {speakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <span className="text-slate-200">|</span>

          {/* Quick Coding IDE Switcher Button */}
          <button
            type="button"
            onClick={() => setWorkspaceMode(prev => prev === 'editor' ? 'transcript' : 'editor')}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              workspaceMode === 'editor'
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Coding IDE Sandbox"
          >
            <Code2 className="w-4 h-4" />
            <span>Coding IDE</span>
            {isAiCodingQuestion && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* End Call Button */}
        <Button
          onClick={() => setShowEndModal(true)}
          variant="danger"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold"
          icon={PhoneOff}
        >
          End Interview
        </Button>
      </footer>

      {/* Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[9999] select-none text-left p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full space-y-4 text-slate-900 shadow-xl">
            <div className="flex items-center space-x-2 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="text-sm font-semibold text-slate-900">End Interview Assessment?</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              You will complete and submit your live interview assessment and video recording. Are you ready to finalize?
            </p>

            <div className="flex space-x-3 pt-2 select-none">
              <Button
                onClick={() => setShowEndModal(false)}
                variant="ghost"
                className="flex-1 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs"
                size="sm"
              >
                Continue Interview
              </Button>
              <Button
                onClick={handleEndAssessment}
                variant="danger"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium"
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

export default LiveInterview;
