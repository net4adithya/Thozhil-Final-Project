import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShieldAlert, 
  Maximize2, 
  AlertTriangle, 
  Clock, 
  XOctagon, 
  EyeOff, 
  CheckCircle2, 
  Lock, 
  ShieldCheck,
  Monitor
} from 'lucide-react';
import { Button } from '../ui/Button';
import { interviewService } from '../../services/interviewService';

/**
 * Synthesizes an alert tone using Web Audio API without external audio assets.
 */
const playAlertSound = (type = 'warning') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type === 'critical' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(type === 'critical' ? 880 : 440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type === 'critical' ? 220 : 880, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn('Audio synthesis notice:', err.message);
  }
};

export const ProctorShield = ({
  candidate,
  interview,
  interviewId,
  candidateId,
  onTerminate,
  onViolation,
  maxViolations = 3,
  returnTimeoutSeconds = 20,
  isActive = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  
  // Tab switch & focus violation tracking
  const [violationCount, setViolationCount] = useState(0);
  const [isTabViolated, setIsTabViolated] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(returnTimeoutSeconds);
  const [isPermanentlyBlocked, setIsPermanentlyBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [shortcutWarning, setShortcutWarning] = useState('');

  const countdownTimerRef = useRef(null);
  const secondsLeftRef = useRef(returnTimeoutSeconds);
  const violationCountRef = useRef(0);

  // Keep refs synced
  useEffect(() => {
    secondsLeftRef.current = secondsRemaining;
  }, [secondsRemaining]);

  useEffect(() => {
    violationCountRef.current = violationCount;
  }, [violationCount]);

  /**
   * Request browser fullscreen
   */
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setFullscreenWarning(false);
    } catch (err) {
      console.warn('Fullscreen entry notice:', err.message);
      setIsFullscreen(true);
      setFullscreenWarning(false);
    }
  }, []);

  /**
   * Terminate assessment session due to proctoring policy violation
   */
  const triggerAutoTermination = useCallback((reason) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsPermanentlyBlocked(true);
    setBlockReason(reason);
    playAlertSound('critical');

    if (typeof onTerminate === 'function') {
      onTerminate({
        reason,
        violationCount: violationCountRef.current,
        timestamp: new Date().toISOString()
      });
    }
  }, [onTerminate]);

  /**
   * Persist proctoring observation to backend REST API
   */
  const persistProctorEvent = useCallback((rawType, details = {}) => {
    let eventType = rawType;
    if (rawType === 'TAB_SWITCH_HIDDEN') eventType = 'TAB_HIDDEN';
    if (rawType === 'TAB_SWITCH_RETURNED') eventType = 'TAB_VISIBLE';

    const targetInterviewId = interview?.id || interviewId;
    const targetCandidateId = candidate?.id || candidateId;

    if (targetInterviewId) {
      interviewService.logProctoringEvents(targetInterviewId, {
        candidateId: targetCandidateId,
        events: [{
          eventType,
          timestamp: new Date().toISOString(),
          candidateId: targetCandidateId,
          details
        }]
      }).catch((err) => {
        console.warn('[ProctorShield] Failed to persist proctor event to backend:', err.message);
      });
    }

    if (typeof onViolation === 'function') {
      onViolation(eventType, details);
    }
  }, [interview?.id, interviewId, candidate?.id, candidateId, onViolation]);

  /**
   * Handle Tab Switch / Blur Violation
   */
  const handleViolationTriggered = useCallback((eventType) => {
    if (!isActive || isPermanentlyBlocked) return;

    const nextCount = violationCountRef.current + 1;
    setViolationCount(nextCount);
    violationCountRef.current = nextCount;

    playAlertSound('warning');

    // Persist observation to backend
    persistProctorEvent(eventType, {
      violationNumber: nextCount,
      maxViolations
    });

    // Check if exceeded max allowable violations (3 strikes rule)
    if (nextCount > maxViolations) {
      triggerAutoTermination(`Exceeded maximum allowable infractions (${maxViolations}/${maxViolations} strikes). Assessment permanently locked and completed.`);
      return;
    }

    setIsTabViolated(true);
    setSecondsRemaining(returnTimeoutSeconds);
    secondsLeftRef.current = returnTimeoutSeconds;

    // Start strict 20-second return countdown
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      const remaining = secondsLeftRef.current - 1;
      secondsLeftRef.current = remaining;
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        triggerAutoTermination('Failed to return to assessment window within the 20-second grace window. Assessment terminated and completed.');
      }
    }, 1000);
  }, [isActive, isPermanentlyBlocked, maxViolations, returnTimeoutSeconds, triggerAutoTermination, persistProctorEvent]);

  /**
   * Clear violation when candidate successfully returns
   */
  const handleAcknowledgeReturn = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsTabViolated(false);
    const returnTimeSeconds = returnTimeoutSeconds - secondsRemaining;
    setSecondsRemaining(returnTimeoutSeconds);

    // Persist return event
    persistProctorEvent('TAB_VISIBLE', {
      awayDurationSeconds: returnTimeSeconds,
      action: 'CANDIDATE_RETURNED'
    });
  };

  // Fullscreen state listener
  useEffect(() => {
    if (!isActive) return;

    const checkFullscreen = () => {
      const inFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(inFs);
      if (!inFs && !isPermanentlyBlocked) {
        setFullscreenWarning(true);
        persistProctorEvent('FULLSCREEN_EXITED', { reason: 'Fullscreen mode exited' });
      } else if (inFs) {
        setFullscreenWarning(false);
        persistProctorEvent('FULLSCREEN_ENTERED', { reason: 'Entered fullscreen mode' });
      }
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);

    // Initial fullscreen attempt
    enterFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
    };
  }, [isActive, isPermanentlyBlocked, enterFullscreen, persistProctorEvent]);

  // Tab switch & window blur listeners (visibilitychange & blur)
  useEffect(() => {
    if (!isActive) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolationTriggered('TAB_SWITCH_HIDDEN');
      } else {
        persistProctorEvent('TAB_VISIBLE', { visibilityState: document.visibilityState });
      }
    };

    const onWindowBlur = () => {
      // User switched window, opened Alt+Tab, or clicked external extension / Ask Gemini
      handleViolationTriggered('WINDOW_BLUR');
    };

    const onWindowFocus = () => {
      persistProctorEvent('WINDOW_FOCUS', { timestamp: new Date().toISOString() });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isActive, handleViolationTriggered, persistProctorEvent]);

  // Prevent right-click and unauthorized shortcuts (e.g. Ask Gemini, Copy, Paste, DevTools)
  useEffect(() => {
    if (!isActive) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      setShortcutWarning('Right-click context menu and external assistant menus are restricted.');
      persistProctorEvent('CONTEXT_MENU_ATTEMPT', { action: 'Right-click menu attempted' });
      setTimeout(() => setShortcutWarning(''), 3000);
      return false;
    };

    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (DevTools / Source inspection)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        setShortcutWarning('Developer inspection shortcuts are strictly prohibited.');
        persistProctorEvent('DEVTOOLS_SUSPECTED', { shortcutKey: e.key });
        setTimeout(() => setShortcutWarning(''), 3000);
        return false;
      }

      // Block copying question text
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 5) {
          e.preventDefault();
          setShortcutWarning('Copying assessment question text is prohibited by SEA proctoring.');
          persistProctorEvent('COPY_ATTEMPT', { selectionLength: selection.length });
          setTimeout(() => setShortcutWarning(''), 3000);
          return false;
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, persistProctorEvent]);

  return (
    <>
      {/* 1. Top Proctoring Active Status HUD */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-1.5 rounded-full shadow-lg flex items-center space-x-3 text-xs text-white select-none pointer-events-none">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SEA Proctoring Active</span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center space-x-1 text-slate-300">
          <Monitor className="w-3.5 h-3.5 text-blue-400" />
          <span>Screen Monitored</span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center space-x-1 font-mono">
          <span className="text-slate-400">Violations:</span>
          <span className={`font-bold px-1.5 py-0.2 rounded ${
            violationCount === 0 ? 'bg-emerald-950 text-emerald-300' :
            violationCount === 1 ? 'bg-amber-950 text-amber-300' :
            'bg-red-950 text-red-300 animate-pulse'
          }`}>
            {violationCount} / {maxViolations}
          </span>
        </div>
      </div>

      {/* 2. Floating shortcut/cheat attempt notice */}
      {shortcutWarning && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-slideUp">
          <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
          <span>{shortcutWarning}</span>
        </div>
      )}

      {/* 3. Strict Fullscreen Exit Warning Modal */}
      {fullscreenWarning && !isPermanentlyBlocked && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 text-left select-none">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 mx-auto flex items-center justify-center shadow-xs">
              <Maximize2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Fullscreen Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This assessment requires a continuous full-screen session to maintain examination integrity.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-left space-y-1">
              <span className="font-semibold text-slate-800 block">Proctoring Rule:</span>
              <span className="text-[11px] block text-slate-500">Exiting fullscreen or switching windows is monitored and logged as a session infraction.</span>
            </div>

            <Button
              onClick={enterFullscreen}
              variant="primary"
              size="md"
              className="w-full"
              icon={Maximize2}
            >
              Re-enter Fullscreen Mode
            </Button>
          </div>
        </div>
      )}

      {/* 4. Tab Switch / Window Blur 20-Second Return Countdown Modal */}
      {isTabViolated && !isPermanentlyBlocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 text-left select-none animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-center animate-slideUp">
            
            {/* Top Icon & Status Pill */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Security Notice • Strike {violationCount} of {maxViolations}</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Assessment Window Unfocused
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                A browser tab switch or window blur event was detected. Please confirm your return to keep your assessment active.
              </p>
            </div>

            {/* Grace Period Timer Container */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Return Grace Window</span>
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </span>
              </div>

              {/* Clean Progress Meter */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    secondsRemaining > 10 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(secondsRemaining / returnTimeoutSeconds) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Click below to resume your assessment. If the countdown expires or if 3 cumulative strikes are recorded, your assessment will be submitted automatically.
              </p>
            </div>

            {/* Segmented Strike Indicators */}
            <div className="flex items-center justify-center space-x-2 pt-0.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-[11px] border ${
                    s <= violationCount
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s <= violationCount ? 'bg-amber-600' : 'bg-slate-300'}`} />
                  <span>Strike {s}</span>
                </div>
              ))}
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={handleAcknowledgeReturn}
              variant="primary"
              size="md"
              className="w-full font-semibold shadow-xs"
              icon={CheckCircle2}
            >
              Resume Assessment ({secondsRemaining}s)
            </Button>
          </div>
        </div>
      )}

      {/* 5. Permanent Disqualification & Lock Barrier */}
      {isPermanentlyBlocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 text-left select-none">
          <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-200 mx-auto flex items-center justify-center shadow-xs">
              <XOctagon className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Assessment Locked & Submitted
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your examination session was concluded due to multiple proctoring infractions.
              </p>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-left space-y-1 text-xs">
              <span className="font-semibold text-red-900 block">Infraction Summary:</span>
              <p className="text-red-700 text-[11px] leading-relaxed">
                {blockReason || 'Maximum allowable tab switch limit exceeded (3/3 strikes).'}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 text-left">
              Session incident metadata and monitoring logs have been compiled for evaluator review.
            </p>

            <Button
              onClick={() => {
                const candId = candidate?.id || 'candidate';
                window.location.href = `/candidate/interviews/${candId}/completed?terminated=true`;
              }}
              variant="secondary"
              size="md"
              className="w-full"
            >
              Return to Candidate Portal
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProctorShield;
