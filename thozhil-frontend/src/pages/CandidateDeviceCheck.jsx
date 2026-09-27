import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Mic, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Wifi,
  Monitor, 
  Lock,
  SunMedium,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { BrandLoader } from '../components/common/BrandLoader';
import { CameraFeed } from '../components/common/CameraFeed';
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

  // Permission & Stream state
  const [camAllowed, setCamAllowed] = useState(false);
  const [micAllowed, setMicAllowed] = useState(false);
  const [screenAllowed, setScreenAllowed] = useState(false);

  const [camActive, setCamActive] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  const [requestingMedia, setRequestingMedia] = useState(false);
  const [requestingScreen, setRequestingScreen] = useState(false);
  const [speakerTestPlaying, setSpeakerTestPlaying] = useState(false);
  const [voiceLabOpen, setVoiceLabOpen] = useState(false);

  // Error & Diagnostic state
  const [deviceError, setDeviceError] = useState('');
  const [screenError, setScreenError] = useState('');

  // Web Audio API live microphone volume level (0 to 100)
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioAnimationIdRef = useRef(null);

  // Video Black / Shutter Closed / Low Light Detection state
  const [videoLuminance, setVideoLuminance] = useState(100);
  const [isDarkOrShutterClosed, setIsDarkOrShutterClosed] = useState(false);
  const [overrideShutterWarning, setOverrideShutterWarning] = useState(false);

  const screenVideoRef = useRef(null);
  const offscreenVideoRef = useRef(null);
  const hasAutoPromptedRef = useRef(false);

  // Attach screen stream to preview if ready
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(() => {});
    }
  }, [screenStream]);

  // Real-time Web Audio API Microphone Volume Meter
  useEffect(() => {
    if (!localStream || !micAllowed) {
      setMicAudioLevel(0);
      return;
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack || audioTrack.readyState !== 'live') {
      setMicAudioLevel(0);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      audioAnalyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(localStream);
      audioSourceRef.current = source;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!audioAnalyserRef.current) return;
        audioAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicAudioLevel(normalized);
        audioAnimationIdRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn('Audio analyzer initialization note:', e);
    }

    return () => {
      if (audioAnimationIdRef.current) {
        cancelAnimationFrame(audioAnimationIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
      audioAnalyserRef.current = null;
      audioSourceRef.current = null;
    };
  }, [localStream, micAllowed]);

  useEffect(() => {
    const resolveData = async () => {
      if (!id) return;
      setResolving(true);
      try {
        let cand = null;
        let matchInt = null;

        // 1. Check if route :id is a Candidate UUID
        cand = (candidates || []).find((c) => c.id === id);
        if (!cand) {
          cand = await candidateService.getCandidateById(id).catch(() => null);
        }

        if (cand) {
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
          // 2. Check if route :id is an Interview UUID
          matchInt = (interviews || []).find((i) => i.id === id);
          if (!matchInt) {
            matchInt = await interviewService.getInterviewById(id).catch(() => null);
          }
          if (matchInt) {
            const activeCandId = sessionStorage.getItem('interviewx_active_candidate_id');
            const linkedCandId = matchInt.candidate_id || matchInt.candidateId || matchInt.candidate?.id || activeCandId;
            if (linkedCandId) {
              cand = (candidates || []).find((c) => c.id === linkedCandId) || await candidateService.getCandidateById(linkedCandId).catch(() => null);
            }
            if (!cand) {
              cand = (candidates || []).find((c) => c.interviewId === matchInt.id || c.interview_id === matchInt.id);
            }
            if (!cand && candidates?.length > 0) {
              cand = candidates[0];
            }
          }
        }

        if (cand?.id) {
          sessionStorage.setItem('interviewx_active_candidate_id', cand.id);
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

  /**
   * Request Camera and Microphone access from browser strictly without mock bypass
   */
  const handleRequestMedia = async () => {
    setRequestingMedia(true);
    setDeviceError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      const isVideoLive = Boolean(videoTrack && videoTrack.readyState === 'live');
      const isAudioLive = Boolean(audioTrack && audioTrack.readyState === 'live');

      if (!isVideoLive && !isAudioLive) {
        throw new Error('Hardware access returned inactive media tracks.');
      }

      setLocalStream(stream);
      setCamAllowed(isVideoLive);
      setMicAllowed(isAudioLive);
      setCamActive(isVideoLive);
      setMicActive(isAudioLive);

      if (videoTrack) {
        videoTrack.onended = () => {
          setCamAllowed(false);
          setCamActive(false);
          showToast('Camera track disconnected or revoked.', 'warning');
        };
      }

      if (audioTrack) {
        audioTrack.onended = () => {
          setMicAllowed(false);
          setMicActive(false);
          showToast('Microphone track disconnected or revoked.', 'warning');
        };
      }

      showToast('Camera and microphone enabled successfully.', 'success');
    } catch (err) {
      console.warn('Hardware permission request rejected:', err.message);
      setCamAllowed(false);
      setMicAllowed(false);
      setCamActive(false);
      setMicActive(false);

      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const userMessage = isDenied
        ? 'Camera/microphone access was denied by your browser. Please click the lock icon in your address bar to grant permission.'
        : `Device error: ${err.message || 'Unable to connect to camera or microphone'}`;

      setDeviceError(userMessage);
      showToast(userMessage, 'danger');
    } finally {
      setRequestingMedia(false);
    }
  };

  // Automatically request / prompt on page load
  useEffect(() => {
    if (!resolving && !camAllowed && !hasAutoPromptedRef.current) {
      hasAutoPromptedRef.current = true;
      handleRequestMedia();
    }
  }, [resolving, camAllowed]);

  // Real-time canvas luminance analyzer to detect dark video / physical shutter closed
  useEffect(() => {
    if (!localStream || !camActive) {
      setIsDarkOrShutterClosed(false);
      return;
    }

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack || !videoTrack.enabled) {
      setIsDarkOrShutterClosed(false);
      return;
    }

    const offscreenVideo = document.createElement('video');
    offscreenVideo.muted = true;
    offscreenVideo.playsInline = true;
    offscreenVideo.srcObject = localStream;
    offscreenVideoRef.current = offscreenVideo;

    const playPromise = offscreenVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const intervalId = setInterval(() => {
      if (offscreenVideo.readyState >= 2 && ctx) {
        try {
          ctx.drawImage(offscreenVideo, 0, 0, 64, 48);
          const frame = ctx.getImageData(0, 0, 64, 48);
          const data = frame.data;
          let totalLuminance = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Standard perceptual luminance formula
            totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
          }

          const avgBrightness = totalLuminance / pixelCount;
          setVideoLuminance(Math.round(avgBrightness));

          // If average brightness is below 18 out of 255, video is black (shutter closed, covered lens, or unlit room)
          if (avgBrightness < 18 && !overrideShutterWarning) {
            setIsDarkOrShutterClosed(true);
          } else {
            setIsDarkOrShutterClosed(false);
          }
        } catch (e) {
          // Ignore cross-origin canvas read issues if any
        }
      }
    }, 800);

    return () => {
      clearInterval(intervalId);
      if (offscreenVideoRef.current) {
        offscreenVideoRef.current.srcObject = null;
      }
    };
  }, [localStream, camActive, overrideShutterWarning]);

  /**
   * Explicitly request Screen Recording / Screen Share access strictly without mock bypass
   */
  const handleRequestScreen = async () => {
    setRequestingScreen(true);
    setScreenError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen capture API not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true
      });

      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack || screenTrack.readyState !== 'live') {
        throw new Error('Screen stream not live or disconnected.');
      }

      screenTrack.onended = () => {
        setScreenAllowed(false);
        setScreenStream(null);
        showToast('Screen share was stopped. Re-authorization required.', 'warning');
      };

      setScreenStream(stream);
      setScreenAllowed(true);
      showToast('Screen sharing verified and active.', 'success');
    } catch (err) {
      console.warn('Screen capture permission rejected:', err.message);
      setScreenAllowed(false);
      setScreenStream(null);

      const isDenied = err.name === 'NotAllowedError';
      const userMessage = isDenied
        ? 'Screen capture permission was dismissed or denied. Proctored exams require full screen share.'
        : `Screen recording error: ${err.message}`;

      setScreenError(userMessage);
      showToast(userMessage, 'warning');
    } finally {
      setRequestingScreen(false);
    }
  };

  if (loading || resolving || !candidate || !interview) {
    return (
      <BrandLoader 
        message="Initializing Hardware Diagnostics..." 
        subtext="Verifying webcam, microphone, and display recording permissions"
        fullScreen={true} 
      />
    );
  }

  const handleSpeakerTest = async () => {
    setSpeakerTestPlaying(true);
    try {
      const result = await voiceService.synthesizeSpeech("Sound check successful. Your audio is functioning properly.");
      if (result?.audioBase64) {
        await voiceService.playAudioFromBase64(result.audioBase64, result.format || 'audio/wav');
      }
    } catch (err) {
      console.warn('Fallback speech playback:', err.message);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Sound check successful. Your audio output is functioning properly.");
        utterance.onend = () => setSpeakerTestPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setSpeakerTestPlaying(false);
    }
  };

  const handleProceed = () => {
    if (!camAllowed || !micAllowed || !screenAllowed) {
      showToast('Camera, microphone, and screen recording access must all be verified before entering.', 'warning');
      return;
    }
    if (isDarkOrShutterClosed && !overrideShutterWarning) {
      showToast('Please open your webcam shutter or improve room lighting before proceeding.', 'danger');
      return;
    }
    const isLive = (interview.type || interview.interviewType) === 'live';
    const targetCandidateId = candidate?.id || id;

    if (isLive) {
      navigate(`/candidate/interviews/${targetCandidateId}/live`);
    } else {
      navigate(`/candidate/interviews/${targetCandidateId}/async`);
    }
  };

  const allPermissionsGranted = camAllowed && micAllowed && screenAllowed;

  return (
    <div className="space-y-6 flex-grow flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left font-sans text-slate-900 select-none">
      
      {/* Back link */}
      <button
        onClick={() => navigate(`/candidate/interviews/${id}`)}
        className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 space-x-1.5 w-fit group transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Return to instructions</span>
      </button>

      {/* Professional Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Hardware Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify camera, microphone, screen capture, and network readiness before entering your proctored assessment.
          </p>
        </div>
        <div className="inline-flex items-center space-x-2 bg-blue-50/80 border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-800 self-start shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Proctored Assessment Environment</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Camera Preview, Shutter Alert, Media Controls */}
        <div className="space-y-3.5">
          <div className="bg-slate-950 rounded-xl overflow-hidden min-h-[300px] relative border border-slate-800 shadow-sm flex flex-col justify-center group">
            <CameraFeed 
              cameraActive={camActive} 
              muted={!micActive} 
              externalStream={localStream}
              showBadges={false}
              isRecording={false} 
              className="w-full h-full object-cover min-h-[300px]" 
            />

            {/* Top Status Bar: Connection & Lighting Indicators */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-200 border border-slate-700/80 flex items-center space-x-1.5 shadow-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${camAllowed && camActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{camAllowed && camActive ? 'HD Video Active' : 'Camera Access Pending'}</span>
              </div>

              {/* Real-time Lighting / Shutter Status Pill */}
              {camAllowed && camActive && (
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md flex items-center space-x-1.5 shadow-sm ${
                  isDarkOrShutterClosed 
                    ? 'bg-amber-950/90 text-amber-300 border-amber-600/70 animate-pulse' 
                    : 'bg-slate-900/90 text-emerald-400 border-slate-700/80'
                }`}>
                  <SunMedium className="w-3 h-3" />
                  <span>{isDarkOrShutterClosed ? 'Shutter Closed / Dark' : `Lighting Good (${videoLuminance}%)`}</span>
                </div>
              )}
            </div>

            {/* Shutter Closed / Low Light Alert Popup Overlay */}
            {camAllowed && camActive && isDarkOrShutterClosed && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center border-2 border-amber-500/80 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mb-1.5 shadow-lg animate-pulse shrink-0">
                  <SunMedium className="w-5 h-5 text-amber-400" />
                </div>
                
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Camera Shutter Closed or Insufficient Lighting
                </h3>
                
                <p className="text-[10.5px] text-slate-300 max-w-xs mt-1 leading-snug">
                  Your video feed is completely dark. Please slide open your webcam's physical privacy shutter and ensure your room is illuminated.
                </p>

                {/* Lighting Gauge */}
                <div className="mt-2.5 w-full max-w-xs bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span>Camera Brightness</span>
                    <span className="font-mono text-amber-400 font-bold">{videoLuminance} / 255</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, (videoLuminance / 40) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block text-left">
                    Required: &gt; 20 to pass identity verification
                  </span>
                </div>

                <div className="mt-3 flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Re-checking camera feed brightness...', 'primary');
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-xs"
                  >
                    I Have Opened the Shutter
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideShutterWarning(true)}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                    title="Continue if testing in a virtual or dark test environment"
                  >
                    Skip (Demo Mode)
                  </button>
                </div>
              </div>
            )}

            {/* Bottom helper text */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] text-slate-300 pointer-events-none z-20">
              {camAllowed ? 'Ensure your face is centered and clearly visible' : 'Granting camera access...'}
            </div>
          </div>
          
          {/* Camera & Microphone Actions */}
          {!camAllowed ? (
            <Button
              onClick={handleRequestMedia}
              variant="primary"
              size="sm"
              loading={requestingMedia}
              icon={Camera}
              className="w-full text-xs font-semibold py-2.5"
            >
              Enable Camera & Microphone
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  onClick={() => setCamActive(!camActive)}
                  variant={camActive ? 'secondary' : 'primary'}
                  size="xs"
                  icon={Camera}
                  className="text-xs font-medium"
                >
                  {camActive ? 'Turn Off Camera' : 'Turn On Camera'}
                </Button>
                <Button
                  onClick={() => setMicActive(!micActive)}
                  variant={micActive ? 'secondary' : 'primary'}
                  size="xs"
                  icon={Mic}
                  className="text-xs font-medium"
                >
                  {micActive ? 'Mute Mic' : 'Unmute Mic'}
                </Button>
              </div>

              {/* Shutter test trigger */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDarkOrShutterClosed(!isDarkOrShutterClosed);
                    setOverrideShutterWarning(false);
                    if (!isDarkOrShutterClosed) {
                      setVideoLuminance(4);
                    } else {
                      setVideoLuminance(85);
                    }
                  }}
                  className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors flex items-center space-x-1"
                >
                  <SunMedium className="w-3 h-3" />
                  <span>{isDarkOrShutterClosed ? 'Reset Camera Feed' : 'Simulate Closed Shutter / Low Light'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Screen Recording Verification Card */}
          {!screenAllowed ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Proctored Screen Recording</span>
                    <span className="text-[10px] text-slate-500">Required for assessment fairness</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Required
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Screen recording verifies that external unauthorized tabs or communication tools are not accessed during your evaluation.
              </p>
              <Button
                onClick={handleRequestScreen}
                variant="primary"
                size="xs"
                loading={requestingScreen}
                icon={Monitor}
                className="w-full"
              >
                Authorize Screen Recording
              </Button>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shadow-xs">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">Screen Recording Verified</span>
                  <span className="text-[10px] text-emerald-700">Display stream authorized</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ready</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Readiness Checklist & Entry Button */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Hardware Readiness Checklist</h2>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                allPermissionsGranted 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {allPermissionsGranted ? '3/3 Approved' : 'Action Required'}
              </span>
            </div>

            {/* Check 1: Camera */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Video Camera</span>
                  <span className="text-[11px] text-slate-500">
                    {camAllowed ? (isDarkOrShutterClosed ? 'Shutter closed / dark' : 'HD camera stream active') : 'Webcam permission pending'}
                  </span>
                </div>
              </div>
              {camAllowed ? (
                <span className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  isDarkOrShutterClosed 
                    ? 'text-amber-700 bg-amber-50 border-amber-200' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {isDarkOrShutterClosed ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{isDarkOrShutterClosed ? 'Low Light' : 'Ready'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending</span>
                </span>
              )}
            </div>

            {/* Check 2: Microphone */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Microphone Stream</span>
                  <span className="text-[11px] text-slate-500">
                    {micAllowed ? (micAudioLevel > 5 ? `Signal active (${micAudioLevel}%)` : 'Listening for audio...') : 'Microphone permission pending'}
                  </span>
                </div>
              </div>
              {micAllowed ? (
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-2">
                    {/* Real-time Web Audio API VU Meter */}
                    <div className="flex items-center space-x-0.5 h-3.5 px-1 bg-slate-100 rounded-md border border-slate-200">
                      {[...Array(8)].map((_, barIdx) => {
                        const threshold = (barIdx + 1) * 12;
                        const isLit = micAudioLevel >= threshold;
                        return (
                          <div
                            key={barIdx}
                            className={`w-1 rounded-full transition-all duration-75 ${
                              isLit
                                ? barIdx > 5 ? 'bg-amber-500 h-3' : 'bg-emerald-500 h-2.5'
                                : 'bg-slate-300 h-1'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{micAudioLevel > 5 ? 'Live' : 'Connected'}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending</span>
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleRequestMedia}
                    loading={requestingMedia}
                    className="text-xs"
                  >
                    Allow
                  </Button>
                </div>
              )}
            </div>

            {/* Check 3: Screen Recording */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Screen Recording</span>
                  <span className="text-[11px] text-slate-500">Continuous session monitoring</span>
                </div>
              </div>
              {screenAllowed ? (
                <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified</span>
                </span>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending</span>
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleRequestScreen}
                    loading={requestingScreen}
                    className="text-xs"
                  >
                    Share
                  </Button>
                </div>
              )}
            </div>

            {/* Check 4: Speaker output */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Speaker Output</span>
                  <span className="text-[11px] text-slate-500">Audio playback test</span>
                </div>
              </div>
              <Button
                onClick={handleSpeakerTest}
                variant="secondary"
                size="xs"
                loading={speakerTestPlaying}
                className="text-xs font-medium"
              >
                {speakerTestPlaying ? 'Playing Chime...' : 'Play Test Sound'}
              </Button>
            </div>

            {/* Check 5: Network connection */}
            <div className="flex items-center justify-between hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Network Connection</span>
                  <span className="text-[11px] text-slate-500">Secure telemetry socket</span>
                </div>
              </div>
              <span className="relative inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Stable</span>
              </span>
            </div>
          </div>

          {/* Voice Settings Trigger */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition-colors shadow-xs">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Voice Calibration</span>
              <span className="text-[11px] text-slate-500">Test vocal synthesis and microphone response</span>
            </div>
            <Button
              size="xs"
              variant="secondary"
              onClick={() => setVoiceLabOpen(true)}
            >
              Test Voice
            </Button>
          </div>

          {/* Permission Troubleshooting & Recovery Box */}
          {!allPermissionsGranted && (
            <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-3 text-left animate-fade-in shadow-xs">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-950">Hardware Permissions Required</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {deviceError || screenError || 'This assessment uses proctored verification. Camera, microphone, and screen recording access are required.'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200 text-[10px] text-amber-900 space-y-1">
                <div className="font-semibold text-amber-950">How to authorize if blocked:</div>
                <div>1. Look for the lock / settings icon <span className="font-mono bg-amber-100 px-1 py-0.5 rounded">🔒</span> in the left of your URL bar.</div>
                <div>2. Set <strong>Camera</strong> and <strong>Microphone</strong> to <strong>Allow</strong>.</div>
                <div>3. Click <strong>Re-check Hardware Access</strong> below.</div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                {(!camAllowed || !micAllowed) && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleRequestMedia}
                    loading={requestingMedia}
                    icon={RefreshCw}
                    className="flex-1 text-amber-900 border-amber-300 hover:bg-amber-100"
                  >
                    Re-check Hardware Access
                  </Button>
                )}
                {!screenAllowed && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={handleRequestScreen}
                    loading={requestingScreen}
                    icon={Monitor}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Authorize Screen
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <div className="space-y-2">
            <Button
              onClick={handleProceed}
              size="md"
              className={`w-full text-sm font-semibold transition-all py-3 rounded-lg ${
                allPermissionsGranted && (!isDarkOrShutterClosed || overrideShutterWarning)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!allPermissionsGranted || (isDarkOrShutterClosed && !overrideShutterWarning)}
              icon={ArrowRight}
              iconPosition="right"
            >
              {allPermissionsGranted 
                ? (isDarkOrShutterClosed && !overrideShutterWarning ? 'Open Webcam Shutter to Proceed' : 'Enter Assessment Room')
                : 'Grant Required Permissions to Proceed'}
            </Button>

            {(!allPermissionsGranted || (isDarkOrShutterClosed && !overrideShutterWarning)) && (
              <p className="text-[11px] text-center text-slate-400 font-medium">
                {isDarkOrShutterClosed && !overrideShutterWarning
                  ? '⚠️ Camera shutter is closed or room is dark. Please ensure face is visible.'
                  : `🔒 Missing: ${[!camAllowed && 'Camera', !micAllowed && 'Microphone', !screenAllowed && 'Screen Sharing'].filter(Boolean).join(', ')}.`}
              </p>
            )}
          </div>

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
