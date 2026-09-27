import { useState, useEffect, useRef, useCallback } from 'react';
import { interviewService } from '../services/interviewService';

export const useProctoringObserver = ({
  interviewId,
  candidateId,
  sessionId,
  onEventLogged,
  sendWebSocketEvent = null
} = {}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [proctoringLog, setProctoringLog] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);

  const pendingEventsRef = useRef([]);
  const flushTimerRef = useRef(null);

  /**
   * Log an observable technical proctoring event
   */
  const logEvent = useCallback((eventType, details = {}) => {
    const eventObj = {
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || `session-${interviewId}`,
      candidateId,
      details
    };

    console.log(`[ProctoringObserver] Event: ${eventType}`, details);
    setLastEvent(eventObj);
    setProctoringLog((prev) => [...prev, eventObj]);

    // Send immediately via WebSocket if active
    if (sendWebSocketEvent && typeof sendWebSocketEvent === 'function') {
      sendWebSocketEvent('proctoring:event', eventObj);
    }

    // Queue for REST persistence
    pendingEventsRef.current.push(eventObj);

    if (onEventLogged) {
      onEventLogged(eventObj);
    }
  }, [sessionId, interviewId, candidateId, sendWebSocketEvent, onEventLogged]);

  /**
   * Flushes queued proctoring events to backend REST API
   */
  const flushEvents = useCallback(async () => {
    if (!interviewId || pendingEventsRef.current.length === 0) return;

    const eventsToSend = [...pendingEventsRef.current];
    pendingEventsRef.current = [];

    try {
      await interviewService.logProctoringEvents(interviewId, {
        candidateId,
        sessionId,
        events: eventsToSend
      });
    } catch (err) {
      console.warn('[ProctoringObserver] Batch log notice:', err.message);
      // Re-queue on failure
      pendingEventsRef.current = [...eventsToSend, ...pendingEventsRef.current];
    }
  }, [interviewId, candidateId, sessionId]);

  // Periodic flush timer (every 10 seconds)
  useEffect(() => {
    flushTimerRef.current = setInterval(() => {
      flushEvents();
    }, 10000);

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flushEvents(); // Flush remaining on unmount
    };
  }, [flushEvents]);

  // Tab Visibility Change Listener (Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        logEvent('TAB_HIDDEN', {
          visibilityState: document.visibilityState
        });
      } else {
        logEvent('TAB_VISIBLE', {
          visibilityState: document.visibilityState
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logEvent]);

  // Fullscreen Change Listener (Fullscreen API)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      if (isCurrentlyFullscreen) {
        logEvent('FULLSCREEN_ENTERED');
      } else {
        setFullscreenExitCount((prev) => prev + 1);
        logEvent('FULLSCREEN_EXITED');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [logEvent]);

  /**
   * Request entering fullscreen mode
   */
  const enterFullscreen = useCallback(async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      console.warn('[ProctoringObserver] Fullscreen request notice:', err.message);
    }
  }, []);

  /**
   * Request exiting fullscreen mode
   */
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.warn('[ProctoringObserver] Exit fullscreen notice:', err.message);
    }
  }, []);

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    tabSwitchCount,
    fullscreenExitCount,
    proctoringLog,
    lastEvent,
    logEvent,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    flushEvents
  };
};

export default useProctoringObserver;
