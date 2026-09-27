import { useState, useEffect, useRef, useCallback } from 'react';

// Live Interview States
export const LIVE_STATES = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  INTRODUCTION: 'INTRODUCTION',
  AI_SPEAKING: 'AI_SPEAKING',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  AI_THINKING: 'AI_THINKING',
  NEXT_QUESTION: 'NEXT_QUESTION',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
  DISCONNECTED: 'DISCONNECTED'
};

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY_MS = 1000;

export const useLiveInterviewSession = ({
  interviewId,
  candidateId,
  onAiSpeaking,
  onCandidateTurn,
  onCompleted,
  onError
} = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  const [sessionState, setSessionState] = useState(LIVE_STATES.IDLE);
  const [sessionId, setSessionId] = useState(null);
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [currentAiPhrase, setCurrentAiPhrase] = useState('');
  const [currentPhraseType, setCurrentPhraseType] = useState('intro');
  const [transcripts, setTranscripts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [report, setReport] = useState(null);

  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isManuallyClosedRef = useRef(false);

  // Keep latest callback references to prevent stale closures and unnecessary reconnects
  const onAiSpeakingRef = useRef(onAiSpeaking);
  const onCandidateTurnRef = useRef(onCandidateTurn);
  const onCompletedRef = useRef(onCompleted);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onAiSpeakingRef.current = onAiSpeaking;
    onCandidateTurnRef.current = onCandidateTurn;
    onCompletedRef.current = onCompleted;
    onErrorRef.current = onError;
  }, [onAiSpeaking, onCandidateTurn, onCompleted, onError]);

  // Derive WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    // 1. Explicit WebSocket URL from environment
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    // 2. Derive from REST API URL if configured
    if (import.meta.env.VITE_API_URL) {
      try {
        const apiUrl = new URL(import.meta.env.VITE_API_URL);
        const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProtocol}//${apiUrl.host}/ws/live`;
      } catch (e) {
        console.warn('[useLiveInterview] Failed to parse VITE_API_URL for WebSocket derivation:', e.message);
      }
    }
    // 3. Fallback based on browser window location
    const isHttps = window.location.protocol === 'https:';
    const wsProtocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    // Backend default port is 5000
    const port = window.location.port === '5173' || window.location.port === '3000' ? '5000' : (window.location.port || '5000');
    return `${wsProtocol}//${host}:${port}/ws/live`;
  }, []);

  // Helper to derive scoped session storage key
  const getSessionKey = useCallback(() => {
    if (interviewId && candidateId) return `interviewx_live_session_${interviewId}_${candidateId}`;
    if (candidateId) return `interviewx_live_session_cand_${candidateId}`;
    if (interviewId) return `interviewx_live_session_int_${interviewId}`;
    return null;
  }, [interviewId, candidateId]);

  // Clean legacy unscoped keys
  useEffect(() => {
    try {
      sessionStorage.removeItem('interviewx_live_session_id');
    } catch (e) {}
  }, []);

  /**
   * Helper to send standardized WebSocket event
   */
  const sendEvent = useCallback((eventName, data = {}) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn(`[useLiveInterview] Cannot send event [${eventName}]: WebSocket not OPEN`);
      return false;
    }

    const key = getSessionKey();
    const storedId = key ? sessionStorage.getItem(key) : null;

    const envelope = {
      event: eventName,
      sessionId: sessionId || storedId || undefined,
      eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      data
    };

    socketRef.current.send(JSON.stringify(envelope));
    return true;
  }, [sessionId, getSessionKey]);

  /**
   * Disconnect socket cleanly
   */
  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client closed cleanly');
      socketRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  /**
   * Connect / Reconnect to WebSocket Gateway
   */
  const connect = useCallback((isReconnecting = false) => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    isManuallyClosedRef.current = false;
    setConnectionStatus(isReconnecting ? 'reconnecting' : 'connecting');

    try {
      const wsUrl = getWebSocketUrl();
      console.log(`[useLiveInterview] Connecting to: ${wsUrl} (Reconnecting: ${isReconnecting})`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[useLiveInterview] WebSocket connection established');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        setErrorMessage('');

        // Start ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            sendEvent('session:ping');
          }
        }, 20000);

        // Check if reconnecting existing session or initializing fresh
        const key = getSessionKey();
        const storedSessionId = sessionId || (key ? sessionStorage.getItem(key) : null);
        if (isReconnecting && storedSessionId && interviewId) {
          sendEvent('session:reconnect', {
            sessionId: storedSessionId,
            interviewId,
            candidateId
          });
        } else if (interviewId) {
          sendEvent('session:init', {
            interviewId,
            candidateId,
            sessionId: storedSessionId || undefined
          });
        }
      };

      ws.onmessage = (messageEvent) => {
        try {
          const envelope = JSON.parse(messageEvent.data);
          const { event, sessionId: msgSessionId, data = {} } = envelope;

          console.log(`[useLiveInterview] Received event: [${event}]`);

          switch (event) {
            case 'connection:ack':
              break;

            case 'session:initialized': {
              setSessionId(data.sessionId);
              const key = getSessionKey();
              if (key && data.sessionId) {
                sessionStorage.setItem(key, data.sessionId);
              }
              setSessionState(data.state || LIVE_STATES.CONNECTED);
              setCurrentQuestion(data.currentQuestion);
              setCurrentQuestionIndex(data.currentQuestionIndex || 0);
              setTotalQuestions(data.totalQuestions || 0);
              setIsFollowUp(data.isFollowUp || false);

              // Auto-trigger session readiness
              sendEvent('session:ready', { sessionId: data.sessionId });
              break;
            }

            case 'session:state_change':
              setSessionState(data.state);
              break;

            case 'ai:speaking': {
              setSessionState(LIVE_STATES.AI_SPEAKING);
              setCurrentAiPhrase(data.phrase);
              if (data.phraseType) setCurrentPhraseType(data.phraseType);
              if (data.question) setCurrentQuestion(data.question);
              if (data.questionIndex !== undefined) setCurrentQuestionIndex(data.questionIndex);
              if (data.isFollowUp !== undefined) setIsFollowUp(data.isFollowUp);

              const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              setTranscripts((prev) => [
                ...prev,
                { speaker: 'Evaluator (Assessment Guide)', text: data.phrase, timestamp, phraseType: data.phraseType }
              ]);

              if (onAiSpeakingRef.current) {
                onAiSpeakingRef.current(data);
              }
              break;
            }

            case 'candidate:turn': {
              setSessionState(LIVE_STATES.LISTENING);
              if (data.question) setCurrentQuestion(data.question);
              if (data.questionIndex !== undefined) setCurrentQuestionIndex(data.questionIndex);
              if (data.isFollowUp !== undefined) setIsFollowUp(data.isFollowUp);
              if (data.followUpCount !== undefined) setFollowUpCount(data.followUpCount);

              if (onCandidateTurnRef.current) {
                onCandidateTurnRef.current(data);
              }
              break;
            }

            case 'ai:response': {
              if (data.evaluation) {
                console.log('[useLiveInterview] Answer Evaluation Score:', data.evaluation.score);
              }
              break;
            }

            case 'interview:completed': {
              setSessionState(LIVE_STATES.COMPLETED);
              setIsCompleted(true);
              if (data.report) setReport(data.report);
              const key = getSessionKey();
              if (key) {
                sessionStorage.removeItem(key);
              }
              sessionStorage.removeItem('interviewx_live_session_id');

              if (onCompletedRef.current) {
                onCompletedRef.current(data);
              }
              break;
            }

            case 'session:reconnected': {
              setSessionId(data.sessionId);
              setSessionState(data.state || LIVE_STATES.CONNECTED);
              setCurrentQuestion(data.currentQuestion);
              setCurrentQuestionIndex(data.currentQuestionIndex || 0);
              setTotalQuestions(data.totalQuestions || 0);
              setIsFollowUp(data.isFollowUp || false);
              setIsCompleted(data.completed || false);
              
              // Restore transcripts from conversation history
              if (Array.isArray(data.conversationHistory)) {
                const restoredTranscripts = data.conversationHistory.map((item) => ({
                  speaker: item.role === 'ai' ? 'Evaluator (Assessment Guide)' : 'You (Candidate)',
                  text: item.text,
                  timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }));
                setTranscripts(restoredTranscripts);
              }
              break;
            }

            case 'session:turn_ignored':
              console.warn('[useLiveInterview] Duplicate turn ignored by server');
              break;

            case 'session:error':
              console.warn('[useLiveInterview] Server session error:', data.message);
              if (data.code !== 'MALFORMED_JSON' && sessionState !== LIVE_STATES.COMPLETED) {
                setErrorMessage(data.message || 'An error occurred in the live interview session');
              }
              if (data.fatal) {
                setSessionState(LIVE_STATES.ERROR);
              }
              if (onErrorRef.current) onErrorRef.current(data);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('[useLiveInterview] Message handling error:', err);
        }
      };

      ws.onclose = (event) => {
        console.log(`[useLiveInterview] Socket closed. Code: ${event.code}`);
        setConnectionStatus('disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection if not manually closed and not completed
        if (!isManuallyClosedRef.current && sessionState !== LIVE_STATES.COMPLETED) {
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = INITIAL_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current += 1;
            console.log(`[useLiveInterview] Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(delay)}ms`);
            
            setConnectionStatus('reconnecting');
            reconnectTimerRef.current = setTimeout(() => {
              connect(true);
            }, delay);
          } else {
            setErrorMessage('Connection lost. Please click Reconnect to resume your assessment.');
            setConnectionStatus('error');
          }
        }
      };

      ws.onerror = (err) => {
        console.error('[useLiveInterview] WebSocket error event:', err);
      };
    } catch (err) {
      console.error('[useLiveInterview] Connection setup error:', err);
      setConnectionStatus('error');
      setErrorMessage(`Failed to establish real-time connection: ${err.message}`);
    }
  }, [getWebSocketUrl, sessionId, interviewId, candidateId, sendEvent, sessionState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  /**
   * Client signals that AI spoken phrase audio has finished playing in the browser
   */
  const notifyFinishedSpeaking = useCallback((phraseType = 'question') => {
    sendEvent('interviewer:finished_speaking', { phraseType });
  }, [sendEvent]);

  /**
   * Candidate submits answer transcript or code solution
   */
  const submitAnswer = useCallback(({ questionId, transcript, answerText, code, language, testResults, duration = 60 }) => {
    let rawAnswer = (transcript || answerText || '').trim();
    if (!rawAnswer && code) {
      rawAnswer = `Candidate submitted code solution in ${language || 'javascript'}`;
    }
    if (!rawAnswer && !code) return false;

    setSessionState(LIVE_STATES.PROCESSING);
    
    // Append candidate message to transcript locally
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const displayMessage = code 
      ? `${rawAnswer ? rawAnswer + '\n\n' : ''}💻 [Submitted ${language || 'Code'} Solution]:\n\`\`\`${language || 'javascript'}\n${code}\n\`\`\``
      : rawAnswer;

    setTranscripts((prev) => [
      ...prev,
      { speaker: 'You (Candidate)', text: displayMessage, timestamp, isCode: !!code, language }
    ]);

    return sendEvent('candidate:submit_answer', {
      questionId: questionId || currentQuestion?.id,
      transcript: rawAnswer,
      answerText: rawAnswer,
      code: code || null,
      language: language || null,
      testResults: testResults || null,
      duration
    });
  }, [sendEvent, currentQuestion]);

  /**
   * Manual end session
   */
  const endSession = useCallback(() => {
    sendEvent('session:end');
  }, [sendEvent]);

  /**
   * Manual reconnect / retry trigger
   */
  const retryConnection = useCallback(() => {
    setErrorMessage('');
    reconnectAttemptsRef.current = 0;
    if (socketRef.current) {
      try {
        socketRef.current.close(1000, 'Reconnecting');
      } catch (e) {}
      socketRef.current = null;
    }
    connect(false);
  }, [connect]);

  return {
    connectionStatus,
    sessionState,
    sessionId,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    isFollowUp,
    followUpCount,
    currentAiPhrase,
    currentPhraseType,
    transcripts,
    errorMessage,
    isCompleted,
    report,
    connect,
    disconnect,
    notifyFinishedSpeaking,
    submitAnswer,
    endSession,
    retryConnection,
    setErrorMessage
  };
};

export default useLiveInterviewSession;
