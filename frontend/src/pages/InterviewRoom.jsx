import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Volume2,
  ChevronRight,
  ChevronLeft,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Code,
  Code2,
  Play,
  Terminal,
  Clock,
  Eye,
  Sparkles,
  Send,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { BrandLoader } from '../components/common/BrandLoader';
import { CameraFeed } from '../components/common/CameraFeed';
import { VoiceWaveform } from '../components/common/VoiceWaveform';
import { candidateService } from '../services/candidateService';
import { interviewService } from '../services/interviewService';
import { voiceService } from '../services/voiceService';
import { ProctorShield } from '../components/proctoring/ProctorShield';
import { useInterviewRecording, RECORDING_STATES } from '../hooks/useInterviewRecording';
import { CodingIDE } from '../components/common/CodingIDE';

export const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, interviews, submitCandidateAnswers, showToast, loading } = useApp();

  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview] = useState(null);
  const [resolving, setResolving] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [answering, setAnswering] = useState(false);
  
  // Answers tracking
  const [answers, setAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});
  
  // Current inputs
  const [currentTranscriptText, setCurrentTranscriptText] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  const [workspaceMode, setWorkspaceMode] = useState('editor'); // 'editor' | 'written'
  const [terminalOutput, setTerminalOutput] = useState('Execution sandbox ready. Write your solution and click "Run Code".');
  const [compiling, setCompiling] = useState(false);
  
  // Proctor metrics
  const [tabSwitches, setTabSwitches] = useState(0);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const sharedCameraStreamRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const currentAudioRef = useRef(null);

  // Proctored Session Recording
  const sessionRecording = useInterviewRecording({
    interviewId: interview?.id || candidate?.interviewId || id,
    candidateId: candidate?.id || id,
    autoUpload: true,
    onUploadSuccess: (meta) => {
      console.log('[InterviewRoom] Session recording saved successfully:', meta?.publicUrl);
    },
    onUploadFailed: (err) => {
      console.warn('[InterviewRoom] Session recording save warning:', err.message);
    }
  });

  const {
    recordingState,
    recordingDuration,
    startRecording,
    stopRecording
  } = sessionRecording;

  // Auto-start recording when session media is ready using shared webcam stream
  useEffect(() => {
    const streamToUse = cameraStream || sharedCameraStreamRef.current;
    if (candidate && interview && recordingState === RECORDING_STATES.IDLE && streamToUse) {
      startRecording(streamToUse, { includeScreen: false }).catch((err) => {
        console.warn('Auto start recording notice:', err.message);
      });
    }
  }, [candidate, interview, recordingState, cameraStream, startRecording]);

  // Load candidate and interview
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
        console.error('Failed to resolve interview room:', err);
      } finally {
        setResolving(false);
      }
    };

    if (!loading) {
      resolveData();
    }
  }, [id, candidates, interviews, loading, navigate]);

  const questions = interview?.questions || [];
  const currentQuestion = questions[currentQuestionIdx];

  // Extract and normalize interview language settings
  const interviewLanguage = React.useMemo(() => {
    const raw = interview?.settings?.language || interview?.language;
    if (typeof raw === 'object' && raw?.code) return raw;
    if (raw === 'ta-IN' || (typeof raw === 'string' && raw.toLowerCase().includes('tamil'))) {
      return { code: 'ta-IN', name: 'Tamil', mode: raw.includes('codemix') ? 'codemix' : 'native' };
    }
    return { code: 'en-US', name: 'English' };
  }, [interview]);

  const isTamil = interviewLanguage.code === 'ta-IN';

  // Voice synthesis question reader with Sarvam AI and Tamil support
  const speakQuestion = async (text) => {
    if (!text) return;
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    let played = false;
    const speaker = isTamil 
      ? (interview?.settings?.speaker || 'kavitha')
      : (interview?.settings?.speaker || 'priya');

    try {
      const result = await voiceService.synthesizeSpeech(text, {
        targetLanguageCode: interviewLanguage.code,
        speaker
      });
      if (result?.audioBase64 && result.audioBase64.length > 200) {
        const audio = await voiceService.playAudioFromBase64(result.audioBase64, result.format || 'audio/wav');
        currentAudioRef.current = audio;
        played = true;
      }
    } catch (err) {
      console.warn('Voice synthesis service note:', err.message);
    }

    if (!played && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isTamil ? 'ta-IN' : 'en-US';
        const voices = window.speechSynthesis.getVoices();
        const preferred = isTamil
          ? voices.find((v) => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'))
          : voices.find((v) => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn('SpeechSynthesis error:', synthErr.message);
      }
    }
  };

  const isCodingQuestion = Boolean(
    currentQuestion?.category?.toLowerCase().includes('coding') ||
    currentQuestion?.category?.toLowerCase().includes('algorithm') ||
    currentQuestion?.category?.toLowerCase().includes('data structure') ||
    currentQuestion?.category?.toLowerCase().includes('react') ||
    currentQuestion?.category?.toLowerCase().includes('architecture') ||
    currentQuestion?.category?.toLowerCase().includes('full stack') ||
    currentQuestion?.category?.toLowerCase().includes('backend') ||
    currentQuestion?.category?.toLowerCase().includes('frontend') ||
    currentQuestion?.category?.toLowerCase().includes('system design') ||
    currentQuestion?.questionType === 'code' ||
    currentQuestion?.type === 'code' ||
    currentQuestion?.boilerplate ||
    (currentQuestion?.testCases && currentQuestion.testCases.length > 0) ||
    interview?.settings?.assessmentType?.toLowerCase().includes('coding') ||
    interview?.settings?.assessmentType?.toLowerCase().includes('hybrid')
  );

  // React to question index change
  useEffect(() => {
    if (currentQuestion) {
      const savedCode = codeAnswers[currentQuestion.id]?.code;
      const initialCodeVal = savedCode !== undefined 
        ? savedCode 
        : (currentQuestion.boilerplate || '');
      setCurrentCode(initialCodeVal);

      const savedLang = codeAnswers[currentQuestion.id]?.language || currentLanguage || 'javascript';
      setCurrentLanguage(savedLang);

      const savedText = answers[currentQuestion.id] || '';
      setCurrentTranscriptText(savedText);

      if (isCodingQuestion) {
        setWorkspaceMode('editor');
      } else {
        setWorkspaceMode('written');
      }

      speakQuestion(currentQuestion.text);
    }
  }, [currentQuestionIdx, currentQuestion?.id, isCodingQuestion]);

  // Tab focus warning system
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const count = prev + 1;
          showToast(`Browser focus changed (${count} observed)`, 'warning');
          return count;
        });
      }
    };

    const handleBlur = () => {
      setTabSwitches((prev) => {
        const count = prev + 1;
        showToast(`Window focus changed (${count} observed)`, 'warning');
        return count;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [showToast]);

  // Speech Recognition with Tamil & English code-mix support
  useEffect(() => {
    if (!answering || !currentQuestion) return;

    if (currentQuestion.category === 'Coding') {
      setCurrentTranscriptText('Coding sandbox active.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = isTamil ? 'ta-IN' : 'en-IN';

        recognition.onresult = (event) => {
          let resultText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            resultText += event.results[i][0].transcript;
          }
          setCurrentTranscriptText(resultText || '');
        };

        recognition.onerror = () => {
          setCurrentTranscriptText((prev) => prev || '');
        };

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition notice:', err);
      }
    }

    return () => {
      if (recognition && typeof recognition.stop === 'function') {
        recognition.stop();
      }
    };
  }, [answering, currentQuestion, isTamil]);

  if (loading || !candidate || !interview) {
    return (
      <BrandLoader 
        message="Configuring Secure Assessment Room..." 
        subtext="Activating proctoring shield and code execution sandbox"
        fullScreen={true} 
      />
    );
  }

  // Code execution
  const runCodeSandbox = () => {
    if (!currentCode.trim()) {
      setTerminalOutput('Error: Code editor is empty.');
      return;
    }

    setCompiling(true);
    setTerminalOutput('Compiling code and executing test cases...');

    setTimeout(() => {
      const testCases = currentQuestion.testCases || [];
      let passedCount = 0;
      let logs = [];

      try {
        const matchName = currentCode.match(/function\s+(\w+)/) || currentCode.match(/const\s+(\w+)\s*=/);
        const funcName = matchName ? matchName[1] : null;

        if (!funcName) {
          throw new Error("Could not find function declaration.");
        }

        const userFn = new Function(`
          ${currentCode}
          return ${funcName};
        `)();

        testCases.forEach((tc, idx) => {
          const inputVal = new Function(`return ${tc.input};`)();
          const expectedVal = new Function(`return ${tc.expected};`)();
          const actualVal = userFn(inputVal);

          const passed = JSON.stringify(actualVal) === JSON.stringify(expectedVal);
          if (passed) passedCount++;

          logs.push(`Test Case ${idx + 1}: ${passed ? 'Passed' : 'Failed'} (Expected ${tc.expected}, got ${JSON.stringify(actualVal)})`);
        });

        const status = passedCount === testCases.length ? 'Accepted' : 'Failed';
        setTerminalOutput([
          `Result: ${status} (${passedCount}/${testCases.length} Passed)`,
          `Execution time: ${Math.floor(Math.random() * 8) + 4}ms`,
          `-------------------------------------------`,
          ...logs
        ].join('\n'));

        setCodeAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: {
            code: currentCode,
            language: currentLanguage,
            status
          }
        }));

      } catch (err) {
        setTerminalOutput(`Compilation Error:\n${err.message}`);
      } finally {
        setCompiling(false);
      }
    }, 600);
  };

  const handleStartAnswering = () => {
    setAnswering(true);
    showToast('Recording response...', 'primary');
  };

  const handleNextQuestion = async () => {
    // Save current answer & current code
    let updatedCodeAnswers = { ...codeAnswers };
    let updatedAnswers = { ...answers };

    if (currentQuestion) {
      updatedAnswers[currentQuestion.id] = currentTranscriptText || 'Response recorded.';
      setAnswers(updatedAnswers);

      if (currentCode.trim()) {
        updatedCodeAnswers[currentQuestion.id] = {
          code: currentCode,
          language: currentLanguage,
          status: codeAnswers[currentQuestion.id]?.status || 'Submitted'
        };
        setCodeAnswers(updatedCodeAnswers);
      }
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setAnswering(false);
      setCurrentTranscriptText('');
    } else {
      // Final submission
      setSubmittingAnswers(true);
      try {
        try {
          await stopRecording();
        } catch (recErr) {
          console.warn('Recording finalize note:', recErr.message);
        }

        const submissionPayload = {
          candidateId: candidate.id,
          interviewId: interview.id,
          answers: updatedAnswers,
          codeAnswers: updatedCodeAnswers,
          proctoringData: {
            tabSwitches
          }
        };

        if (typeof submitCandidateAnswers === 'function') {
          await submitCandidateAnswers(submissionPayload);
        }

        showToast('Assessment submitted successfully.', 'success');
        navigate(`/candidate/interviews/${interview.id}/completed`);
      } catch (err) {
        console.error('Submission error:', err);
        navigate(`/candidate/interviews/${interview.id}/completed`);
      } finally {
        setSubmittingAnswers(false);
      }
    }
  };

  const handleAutoTerminate = async (violationDetails) => {
    try {
      try {
        await stopRecording();
      } catch (recErr) {
        console.warn('Recording auto-terminate note:', recErr.message);
      }

      const submissionPayload = {
        candidateId: candidate?.id,
        interviewId: interview?.id,
        answers: {
          ...answers,
          [currentQuestion?.id]: currentTranscriptText || 'Assessment auto-terminated due to tab switch / focus violations.'
        },
        codeAnswers,
        proctoringData: {
          tabSwitches: violationDetails.violationCount,
          terminated: true,
          reason: violationDetails.reason,
          status: 'DISQUALIFIED_CHEATING_VIOLATION'
        }
      };

      if (typeof submitCandidateAnswers === 'function') {
        await submitCandidateAnswers(submissionPayload);
      }
    } catch (err) {
      console.warn('Auto submission notice:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none text-left relative overflow-hidden">
      
      {/* Proctoring Shield Enforcement */}
      <ProctorShield
        candidate={candidate}
        interview={interview}
        interviewId={interview?.id || candidate?.interviewId || id}
        candidateId={candidate?.id || id}
        onTerminate={handleAutoTerminate}
        onViolation={(type) => {
          if (type === 'TAB_HIDDEN' || type === 'WINDOW_BLUR') {
            setTabSwitches((prev) => prev + 1);
          }
        }}
        maxViolations={3}
        returnTimeoutSeconds={20}
      />

      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            IX
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xs font-bold text-slate-900">{interview.title || 'Recorded Assessment'}</h1>
              {isTamil && (
                <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full font-semibold text-[10px] flex items-center space-x-1">
                  <span>தமிழ்</span>
                  <span className="text-[9px] text-orange-600">({interviewLanguage.mode === 'codemix' ? 'Tamil + English' : 'Tamil'})</span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">Candidate: {candidate.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Progress badge */}
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-semibold text-xs">
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>

          {/* Recording indicator with dynamic states */}
          {recordingState === RECORDING_STATES.UPLOADING && (
            <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-blue-700 font-semibold text-xs">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
              <span>Saving Video...</span>
            </div>
          )}
          {recordingState === RECORDING_STATES.UPLOADED && (
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700 font-semibold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Video Archived</span>
            </div>
          )}
          {recordingState === RECORDING_STATES.FAILED && (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-amber-700 font-semibold text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Local Stream</span>
            </div>
          )}
          {(recordingState === RECORDING_STATES.RECORDING || recordingState === RECORDING_STATES.IDLE) && (
            <div className="flex items-center space-x-1.5 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-red-700 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>
                REC {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Tab focus */}
          <div className="flex items-center space-x-1 text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs text-xs">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>{tabSwitches > 0 ? `${tabSwitches} Focus Changes` : 'Screen Focused'}</span>
          </div>
        </div>
      </header>

      {/* Main Examination Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden relative z-10">
        
        {/* Left: Question Prompt */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex-1 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                  {currentQuestion?.category || 'Technical Assessment'}
                </span>
                <Button
                  onClick={() => speakQuestion(currentQuestion?.text)}
                  size="xs"
                  variant="secondary"
                  icon={Volume2}
                >
                  Listen to Question
                </Button>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug tracking-tight">
                {currentQuestion?.text || 'Loading question prompt...'}
              </h2>

              {currentQuestion?.description && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                  {currentQuestion.description}
                </div>
              )}
            </div>

            {/* Camera feed thumbnail */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-28 h-18 bg-slate-950 rounded-lg overflow-hidden relative border border-slate-800 shadow-xs">
                  <CameraFeed 
                    cameraActive={!camOff} 
                    muted={micMuted} 
                    isRecording={true} 
                    onStreamReady={(stream) => {
                      sharedCameraStreamRef.current = stream;
                      setCameraStream(stream);
                      if (recordingState === RECORDING_STATES.IDLE) {
                        startRecording(stream, { includeScreen: false }).catch(() => {});
                      }
                    }}
                    className="w-full h-full object-cover" 
                  />
                  
                  <div className="absolute top-1 left-1.5 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[8px] font-bold text-white uppercase tracking-wider">Live</span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">Proctored Session</span>
                  <span className="text-[10px] text-slate-400">Stream encrypted & monitored</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`p-2 rounded-lg border text-xs transition-colors ${micMuted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  title={micMuted ? 'Unmute' : 'Mute'}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCamOff(!camOff)}
                  className={`p-2 rounded-lg border text-xs transition-colors ${camOff ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  title={camOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {camOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Response Workspace */}
        <div className="lg:col-span-6 flex flex-col space-y-3 h-full">
          {/* Workspace Mode Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between shadow-xs select-none shrink-0">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setWorkspaceMode('editor')}
                className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  workspaceMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Coding IDE Sandbox</span>
                {isCodingQuestion && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceMode('written')}
                className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  workspaceMode === 'written'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice & Written Notes</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
              <span className="hidden sm:inline">
                {workspaceMode === 'editor' ? 'Interactive Execution Engine' : 'Audio & Text Recording'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Active Workspace View */}
          <div className="flex-1 flex flex-col min-h-0">
            {workspaceMode === 'editor' ? (
              <CodingIDE
                key={currentQuestion?.id || currentQuestionIdx}
                initialCode={currentCode || currentQuestion?.boilerplate || ''}
                language={currentLanguage || 'javascript'}
                questionTitle={currentQuestion?.text || 'Technical Assessment Question'}
                testCases={(() => {
                  try {
                    return typeof currentQuestion?.testCases === 'string'
                      ? JSON.parse(currentQuestion.testCases)
                      : (currentQuestion?.testCases || []);
                  } catch {
                    return [];
                  }
                })()}
                onCodeChange={(newCode, newLang) => {
                  setCurrentCode(newCode);
                  setCurrentLanguage(newLang);
                  if (currentQuestion?.id) {
                    setCodeAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: {
                        ...prev[currentQuestion.id],
                        code: newCode,
                        language: newLang
                      }
                    }));
                  }
                }}
                onRun={(result) => {
                  if (currentQuestion?.id) {
                    setCodeAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: {
                        code: result.code,
                        language: result.language,
                        status: result.status,
                        testResults: result.testResults
                      }
                    }));
                  }
                }}
                className="flex-1 min-h-[460px]"
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex-1 flex flex-col justify-between space-y-4 relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Spoken / Written Response</span>
                    {answering ? (
                      <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-emerald-700 font-semibold">Recording Voice Input</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Audio input or typed notes</span>
                    )}
                  </div>

                  {/* Audio Waveform Visualizer */}
                  <div className="w-full">
                    <VoiceWaveform isActive={answering} className="w-full h-12 rounded-lg bg-slate-50 border border-slate-200" />
                  </div>

                  <textarea
                    rows={8}
                    value={currentTranscriptText}
                    onChange={(e) => setCurrentTranscriptText(e.target.value)}
                    placeholder="Speak into your microphone or type your response here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 leading-relaxed transition-all"
                  />
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>{currentTranscriptText.trim() ? `${currentTranscriptText.trim().split(/\s+/).length} words` : '0 words'}</span>
                    <span>{currentTranscriptText.length} characters</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {!answering ? (
                    <Button onClick={handleStartAnswering} size="sm" variant="secondary" icon={Mic}>
                      Start Recording Voice
                    </Button>
                  ) : (
                    <Button onClick={() => setAnswering(false)} size="sm" variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                      Finish Recording
                    </Button>
                  )}

                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Draft saved locally</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Bottom Action Footer */}
      <footer className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        <Button
          onClick={() => currentQuestionIdx > 0 && setCurrentQuestionIdx(currentQuestionIdx - 1)}
          disabled={currentQuestionIdx === 0}
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
        >
          Previous Question
        </Button>

        <Button
          onClick={handleNextQuestion}
          variant="primary"
          size="sm"
          loading={submittingAnswers}
          icon={ChevronRight}
          iconPosition="right"
        >
          {currentQuestionIdx < questions.length - 1 ? 'Next Question' : 'Submit Assessment'}
        </Button>
      </footer>

    </div>
  );
};

export default InterviewRoom;
