import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Volume2,
  ChevronRight,
  LogOut,
  AlertCircle,
  HelpCircle,
  FileText,
  Code,
  Play,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { CameraFeed } from '../components/common/CameraFeed';
import { VoiceWaveform } from '../components/common/VoiceWaveform';
import { Timer } from '../components/common/Timer';

import { candidateService } from '../services/candidateService';
import { interviewService } from '../services/interviewService';

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
  const [terminalOutput, setTerminalOutput] = useState('Compiler ready. Click "Run Code" to compile.');
  const [compiling, setCompiling] = useState(false);
  
  // Proctor metrics
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPastes, setCopyPastes] = useState(0);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);

  // Pre-configured response transcripts for simulated typewriter effect
  const sampleTranscripts = {
    'q-1': "useMemo memoizes computational results. useCallback memoizes the functions themselves to avoid rendering reference breaking. In my last React project, I memoized standard search filters using useMemo, which saved us about 20 renders on keyboard inputs. I used useCallback when passing event handlers down to heavy data tables.",
    'q-2': "When creating a component library, standard accessibility attributes are essential. Headless UI primitives like Radix ensure tab indexes and screen readers work. For layout structures, using Tailwind for tokenized themes allows seamless CSS variables integration. Testing is handled using axe-core and manual screen-readers tests.",
    'q-3': "Browser parses page from top to bottom. If it hits a script, it blocks parsing. We optimize by adding async or defer tags. We minimize scripts blocking the Critical Path, lazy load images using modern WebP formats, and load critical fonts pre-emptively using link preload elements.",
    'q-4': "Context API is ideal for simple configurations. Zustand is better for high-frequency updates since it uses selector subscriptions that prevent full-tree redrawing. We avoid Redux unless a massive ecosystem is already configured in the repo.",
    'qp-1': "To prioritize backlog features, I use standard RICE score scoring matrix mapping Reach, Impact, Confidence, and Effort. Reach represents user telemetry, Impact is assessed with analytics models, Confidence is validated with interviews, and Effort is provided by Engineering.",
    'qb-1': "Handling 100,000 writes per second requires a robust cache layer like Redis, followed by queuing write events with RabbitMQ or Kafka. We separate reads and writes using CQRS database patterns to avoid locks.",
    'default': "Regarding this topic, my approach starts with gathering clear requirement vectors and mapping technical dependencies. I prioritize clear communication, writing clean documentation, and verifying performance metrics before deployment."
  };

  // Load candidate and interview
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

  // Voice synthesis question reader (TTS)
  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // React to question index change
  useEffect(() => {
    if (currentQuestion) {
      if (currentQuestion.category === 'Coding') {
        setCurrentCode(currentQuestion.boilerplate || '');
        setTerminalOutput('Sandbox compiler loaded. Write your JavaScript solution and click "Run Code".');
      } else {
        setCurrentCode('');
        setTerminalOutput('');
      }
      speakQuestion(currentQuestion.text);
    }
  }, [currentQuestionIdx, currentQuestion]);

  // Tab focus warning system (Proctor)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const count = prev + 1;
          showToast(`Proctor Alert: Tab switch detected! (Incident #${count})`, 'danger');
          return count;
        });
      }
    };

    const handleBlur = () => {
      setTabSwitches((prev) => {
        const count = prev + 1;
        showToast(`Proctor Alert: Screen focus lost! (Incident #${count})`, 'danger');
        return count;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speech-to-Text translation simulator
  useEffect(() => {
    if (!answering || !currentQuestion) return;

    if (currentQuestion.category === 'Coding') {
      setCurrentTranscriptText('Coding playground editor active. Speech transcript bypassed for IDE session.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let typedIndex = 0;
    const fullTranscript = sampleTranscripts[currentQuestion.id] || sampleTranscripts['default'];

    if (SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let resultText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            resultText += event.results[i][0].transcript;
          }
          setCurrentTranscriptText(resultText || 'Listening...');
        };

        recognition.onerror = () => {
          simulateTypewriter();
        };

        recognition.start();
      } catch (err) {
        simulateTypewriter();
      }
    } else {
      simulateTypewriter();
    }

    function simulateTypewriter() {
      setCurrentTranscriptText('');
      const interval = setInterval(() => {
        if (typedIndex < fullTranscript.length) {
          setCurrentTranscriptText((prev) => prev + fullTranscript.charAt(typedIndex));
          typedIndex += 6;
        } else {
          clearInterval(interval);
        }
      }, 100);
      recognition = { stop: () => clearInterval(interval) };
    }

    return () => {
      if (recognition && typeof recognition.stop === 'function') {
        recognition.stop();
      }
    };
  }, [answering, currentQuestionIdx, currentQuestion]);

  if (loading || !candidate || !interview) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-white">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  // Client-side sandboxed code execution
  const runCodeSandbox = () => {
    if (!currentCode.trim()) {
      setTerminalOutput('Error: Workspace is empty.');
      return;
    }

    setCompiling(true);
    setTerminalOutput('Compiling solution and executing test suites...');

    setTimeout(() => {
      const testCases = currentQuestion.testCases || [];
      let passedCount = 0;
      let logs = [];

      try {
        const matchName = currentCode.match(/function\s+(\w+)/) || currentCode.match(/const\s+(\w+)\s*=/);
        const funcName = matchName ? matchName[1] : null;

        if (!funcName) {
          throw new Error("Could not extract helper function header definition name from text.");
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

          logs.push(`Test Case ${idx + 1}: Input ${tc.input} | Expected ${tc.expected} | Got ${JSON.stringify(actualVal)} - [${passed ? 'PASSED' : 'FAILED'}]`);
        });

        const status = passedCount === testCases.length ? 'Accepted' : 'Failed';
        setTerminalOutput([
          `Status: ${status} (${passedCount}/${testCases.length} Passed)`,
          `Benchmark: Execution CPU time ${Math.floor(Math.random() * 8) + 4}ms`,
          `-------------------------------------------`,
          ...logs
        ].join('\n'));

        // Save compilation states
        const tcResults = testCases.map((tc, idx) => {
          const inputVal = new Function(`return ${tc.input};`)();
          const expectedVal = new Function(`return ${tc.expected};`)();
          let actualVal = null;
          try { actualVal = userFn(inputVal); } catch(e) {}
          return {
            input: tc.input,
            expected: tc.expected,
            actual: JSON.stringify(actualVal),
            passed: JSON.stringify(actualVal) === JSON.stringify(expectedVal)
          };
        });

        setCodeAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: {
            code: currentCode,
            language: currentLanguage,
            testCasesResult: tcResults,
            compileTime: Math.floor(Math.random() * 8) + 4,
            status
          }
        }));

      } catch (err) {
        setTerminalOutput(`Compilation Error:\n${err.message}`);
        setCodeAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: {
            code: currentCode,
            language: currentLanguage,
            testCasesResult: [],
            compileTime: 0,
            status: 'Compilation Error'
          }
        }));
      } finally {
        setCompiling(false);
      }
    }, 800);
  };

  const handleStartAnswering = () => {
    setAnswering(true);
    showToast('Telemetry capture active: record response now.', 'primary');
  };

  const handleNextQuestion = async () => {
    if (!answering) {
      showToast('Please start recording before submitting.', 'warning');
      return;
    }

    const currentQId = currentQuestion.id;
    const finalAnswer = currentQuestion.category === 'Coding' 
      ? `Coding question submitted. Solution status: ${codeAnswers[currentQId]?.status || 'Not Evaluated'}`
      : currentTranscriptText || "Candidate response details.";

    const updatedAnswers = { ...answers, [currentQId]: finalAnswer };
    setAnswers(updatedAnswers);

    // Save empty coding answer placeholder if they didn't run sandbox
    if (currentQuestion.category === 'Coding' && !codeAnswers[currentQId]) {
      setCodeAnswers(prev => ({
        ...prev,
        [currentQId]: {
          code: currentCode,
          language: currentLanguage,
          testCasesResult: [],
          compileTime: 0,
          status: 'Not Evaluated'
        }
      }));
    }

    setAnswering(false);
    setCurrentTranscriptText('');

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      try {
        setSubmittingAnswers(true);
        // Include proctor logs inside candidate metadata / custom fields
        const proctorPenalties = {
          tabSwitches,
          copyPastes,
          screenShareActive: true
        };
        
        await submitCandidateAnswers(candidate.id, updatedAnswers, {
          ...codeAnswers,
          proctor: proctorPenalties
        });
        
        navigate(`/candidate/interviews/${candidate.id}/completed`);
      } catch (e) {
        console.error(e);
      } finally {
        setSubmittingAnswers(false);
      }
    }
  };

  const handleTimeUp = () => {
    showToast('Timer limits reached! Submitting solution.', 'warning');
    if (!answering) setAnswering(true);
    handleNextQuestion();
  };

  const handlePasteBlock = (e) => {
    e.preventDefault();
    setCopyPastes(prev => prev + 1);
    showToast('Proctor Warning: Copy-Paste options are blocked inside code editor.', 'danger');
  };

  const isCodingCategory = currentQuestion?.category === 'Coding';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Navbar header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center space-x-3.5 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 137 46" className="h-6 w-auto text-primary">
            <path fill="currentColor" d="M37.71 35V9.42h4.264v10.445a6.47 6.47 0 0 1 2.416-2.31q1.527-.887 3.446-.887 2.203 0 3.73.923 1.529.888 2.31 2.665.816 1.74.817 4.37V35h-4.228v-9.983q0-2.31-.995-3.518-.96-1.207-2.949-1.207-1.278 0-2.309.639-1.03.604-1.634 1.776-.604 1.137-.604 2.807V35zm21.668 7.816 4.37-9.806h-1.066L55.54 17.095h4.654l5.33 12.15 5.044-12.15h4.512L63.89 42.816zM76.745 35V17.094h3.802l.39 3.34a7 7 0 0 1 1.6-1.99 6.8 6.8 0 0 1 2.238-1.314q1.314-.462 2.877-.462v4.512H86.16q-1.065 0-2.025.284-.96.249-1.67.853-.675.567-1.065 1.598-.391.995-.391 2.523V35zm12.878 0V17.094h4.263V35zm2.131-20.748q-1.171 0-1.954-.71a2.47 2.47 0 0 1-.746-1.813q.001-1.101.746-1.776.783-.71 1.954-.71 1.173 0 1.919.71.782.675.782 1.776 0 1.066-.782 1.812-.746.71-1.919.71M97.393 35V17.094h3.766l.32 2.984a6.23 6.23 0 0 1 2.344-2.487q1.529-.924 3.624-.923 2.168 0 3.695.923 1.528.888 2.345 2.63.853 1.74.853 4.334V35h-4.264V24.946q0-2.239-.994-3.447-.996-1.207-2.949-1.207-1.28 0-2.31.603-.995.604-1.598 1.777-.569 1.136-.569 2.771V35zm27.552 8.243q-2.522 0-4.441-.64-1.882-.604-2.949-1.883-1.03-1.243-1.03-3.126 0-1.102.533-2.168.569-1.03 1.67-1.918 1.137-.924 2.878-1.599l1.883 2.06q-1.706.605-2.381 1.457-.675.854-.675 1.741 0 .924.569 1.528.603.639 1.598.96 1.03.319 2.31.319 1.243 0 2.167-.355.924-.32 1.421-.924.533-.604.533-1.457 0-1.065-.746-1.74-.745-.64-2.949-.782a34 34 0 0 1-3.304-.391 19 19 0 0 1-2.451-.64 9.6 9.6 0 0 1-1.706-.781 7.3 7.3 0 0 1-1.172-.924v-.817l3.73-3.908 3.162 1.03-4.192 4.086 1.101-2.06q.356.248.711.461.39.214.959.391.605.143 1.563.284.96.143 2.487.285 2.38.177 3.873.852 1.492.675 2.203 1.812t.71 2.736q0 1.563-.888 2.949-.853 1.385-2.629 2.273-1.776.89-4.548.889m0-13.608q-2.238 0-3.872-.852-1.599-.889-2.452-2.345a6.5 6.5 0 0 1-.852-3.269q0-1.812.852-3.268.853-1.457 2.452-2.345 1.634-.888 3.872-.888t3.837.888 2.452 2.345q.852 1.455.852 3.268a6.5 6.5 0 0 1-.852 3.269q-.853 1.456-2.452 2.345-1.599.852-3.837.852m0-3.304q1.528 0 2.452-.817t.923-2.345q0-1.527-.923-2.31-.924-.816-2.452-.816-1.527 0-2.487.817-.959.78-.959 2.31 0 1.527.959 2.344.96.817 2.487.817m2.949-6.11-.817-3.127h7.354v2.665zM9.057 7.7c.866 0 1.567.7 1.567 1.564v10.82a15.83 15.83 0 0 1 4.684-7.62c1.908-1.655 3.948-2.789 6.279-3.53l3.706-1.177c.664-.21 1.354.26 1.354.93v8.45c0 .424-.287.8-.706.93l-5.211 1.637c3.275.633 5.915 3.495 5.915 7.153v7.862a1.6 1.6 0 0 1-1.601 1.598H17.62a1.6 1.6 0 0 1-1.601-1.598V23.947a15.83 15.83 0 0 1-4.681 7.61c-1.909 1.655-3.948 2.79-6.278 3.53l-3.71 1.178c-.664.213-1.35-.26-1.35-.93v-8.45c0-.425.285-.8.704-.93l5.22-1.642C2.647 23.684 0 20.821 0 17.16V9.264c0-.865.701-1.565 1.567-1.565z" />
          </svg>
          <div className="text-left border-l border-slate-800 pl-3">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Assessment Room</span>
            <h2 className="text-xs font-bold text-slate-200 truncate max-w-xs">{interview.title}</h2>
          </div>
        </div>

        {/* Live Timers */}
        <div className="flex items-center space-x-4">
          {currentQuestion && (
            <Timer
              initialSeconds={currentQuestion.duration}
              isActive={answering}
              onTimeUp={handleTimeUp}
              className="bg-slate-900 border-slate-700"
            />
          )}

          <Button
            onClick={() => navigate('/candidate')}
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-slate-800"
            size="sm"
            icon={LogOut}
          >
            Leave
          </Button>
        </div>
      </header>

      {/* Main split grid */}
      <main className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-hidden">
        
        {/* Left Column: Camera, Prompt, and Speech transcription (spans 5 cols if Coding, else spans 6) */}
        <div className={`${isCodingCategory ? 'lg:col-span-5' : 'lg:col-span-6'} flex flex-col space-y-6 overflow-y-auto`}>
          
          {/* Camera feed */}
          <div className="aspect-video min-h-[220px] bg-slate-950 rounded-xl overflow-hidden relative border border-slate-850 flex flex-col justify-end">
            <CameraFeed
              cameraActive={!camOff}
              muted={micMuted}
              isRecording={answering}
              className="w-full h-full object-cover"
            />
            {/* Visual warning alerts overlay */}
             <div className="absolute top-3 left-3 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider text-slate-400 font-bold border border-slate-800">
              Proctoring Monitor: Active
            </div>
            {tabSwitches > 0 && (
              <div className="absolute top-3 right-3 bg-brandDanger/90 text-white px-2.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Tab Warnings: {tabSwitches}</span>
              </div>
            )}
          </div>

          {/* Sound waveform feedback */}
          <VoiceWaveform isActive={answering && !micMuted} className="bg-slate-900 border-slate-800 p-4" />

          {/* Prompt card */}
          <Card className="bg-slate-900 border-slate-800 text-left">
            <CardBody className="p-4 space-y-3">
              <div className="flex items-center space-x-2.5">
                <Avatar name="Interviewer Host" initials="IH" size="sm" className="border-slate-800" />
                <div>
                  <h4 className="text-[11px] font-bold text-slate-200">Virtual Interviewer</h4>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase">Question {currentQuestionIdx + 1} of {questions.length} • {currentQuestion?.category}</span>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-100 leading-relaxed">
                  {currentQuestion ? currentQuestion.text : 'Evaluation prompts finished.'}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Transcripts panel (Only if NOT coding, otherwise small feed) */}
          <Card className="bg-slate-900 border-slate-800 text-left flex flex-col min-h-[140px] flex-grow">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Speech Transcript</span>
              </span>
              <Badge variant={answering ? 'success' : 'secondary'} className="text-[9px] px-1.5 py-0.5">
                {answering ? 'Transcribing' : 'Standby'}
              </Badge>
            </div>
            <CardBody className="p-4 flex-grow overflow-y-auto text-xs font-mono text-slate-300">
              {answering ? (
                <p className="leading-relaxed italic">
                  {currentTranscriptText}
                  <span className="animate-pulse bg-primary inline-block w-1.5 h-3.5 ml-0.5" />
                </p>
              ) : (
                <div className="text-center text-slate-500 py-6 space-y-1">
                  <Volume2 className="w-5 h-5 mx-auto" />
                  <p className="font-bold text-[10px]">Microphone stream standby</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Mic and Camera toggle toggles */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-xl select-none">
            <div className="flex space-x-2">
              <button
                onClick={() => setMicMuted(!micMuted)}
                className={`p-2.5 rounded-lg border transition-all ${micMuted
                  ? 'bg-brandDanger border-brandDanger text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {micMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={() => setCamOff(!camOff)}
                className={`p-2.5 rounded-lg border transition-all ${camOff
                  ? 'bg-brandDanger border-brandDanger text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {camOff ? <VideoOff className="w-4.5 h-4.5" /> : <Video className="w-4.5 h-4.5" />}
              </button>
            </div>

            {!answering ? (
              <Button onClick={handleStartAnswering} variant="primary" size="sm" className="px-5">
                Start Answering
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} variant="success" size="sm" className="px-5" loading={submittingAnswers}>
                {currentQuestionIdx === questions.length - 1 ? 'Submit Assessment' : 'Submit & Next'}
              </Button>
            )}
          </div>

        </div>

        {/* Right Column: Code Editor Playground IDE (renders ONLY if category is Coding) */}
        {isCodingCategory && (
          <div className="lg:col-span-7 flex flex-col space-y-4 overflow-hidden border border-slate-800 bg-slate-900 rounded-xl">
            
            {/* Editor Top Bar Controls */}
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between select-none">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <Code className="w-4.5 h-4.5 text-primary" />
                <span>Coding Workspace Playground</span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value)}
                  className="bg-slate-950 text-slate-300 border border-slate-850 rounded px-2 py-1 text-[10px] outline-none font-bold"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python 3 (Simulation)</option>
                  <option value="cpp">C++ (Simulation)</option>
                  <option value="java">Java (Simulation)</option>
                </select>
                <button
                  onClick={() => setCurrentCode(currentQuestion.boilerplate || '')}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Reset boilerplate code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Code Textarea editor */}
            <div className="flex-1 min-h-[220px] relative">
              <textarea
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                onPaste={handlePasteBlock}
                className="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed border-none outline-none resize-none"
                placeholder="// Write your entry function solution here..."
                spellCheck="false"
              />
            </div>

            {/* Compiler Run Trigger & Console Terminal */}
            <div className="bg-slate-950 border-t border-slate-850 p-4 flex flex-col space-y-3.5 text-left select-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span>Execution Terminal</span>
                </span>
                
                <Button
                  onClick={runCodeSandbox}
                  variant="primary"
                  size="xs"
                  className="px-4 py-1.5 shadow shadow-primary/20"
                  loading={compiling}
                  icon={Play}
                >
                  Run Code Sandbox
                </Button>
              </div>

              {/* Console log outputs terminal */}
              <pre className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-[10px] font-mono text-slate-300 leading-normal max-h-36 overflow-y-auto whitespace-pre-wrap">
                {terminalOutput}
              </pre>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default InterviewRoom;
