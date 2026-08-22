import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import liveSessionManager, { SESSION_STATES } from './liveSessionManager.js';

/**
 * Attaches the Live Interview WebSocket Gateway to the HTTP Server
 * @param {import('http').Server} server 
 */
export const initLiveWebSocket = (server) => {
  const wss = new WebSocketServer({
    server,
    path: '/ws/live'
  });

  console.log('[LiveGateway] Live Interview WebSocket Gateway initialized on path: /ws/live');

  // Map to associate WebSocket connections with their active session IDs
  const socketToSession = new WeakMap();

  /**
   * Helper to send a standardized envelope to a client socket
   */
  const sendEvent = (ws, eventName, data = {}, sessionId = null, eventId = null) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const envelope = {
      event: eventName,
      sessionId: sessionId || 'unassigned',
      eventId: eventId || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      data
    };

    try {
      ws.send(JSON.stringify(envelope));
    } catch (err) {
      console.error('[LiveGateway] Failed to send WebSocket message:', err.message);
    }
  };

  /**
   * Setup Heartbeat Keep-Alive to detect silent socket drops
   */
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[LiveGateway] Terminating inactive socket');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  server.on('close', () => {
    clearInterval(heartbeatInterval);
    wss.close();
  });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    console.log(`[LiveGateway] New incoming client WebSocket connection established from ${req.socket.remoteAddress}`);

    // Send connection acknowledgment
    sendEvent(ws, 'connection:ack', {
      message: 'Connected to InterviewX Live Real-Time Gateway',
      serverTime: new Date().toISOString(),
      protocol: 'live.interview.v1'
    });

    ws.on('message', async (rawMessage) => {
      try {
        const payload = JSON.parse(rawMessage.toString());
        const { event, sessionId, eventId, data = {} } = payload;

        if (!event) {
          return sendEvent(ws, 'session:error', {
            code: 'INVALID_EVENT_FORMAT',
            message: 'Event envelope must contain an "event" field',
            fatal: false
          });
        }

        console.log(`[LiveGateway] Received event [${event}] (Session: ${sessionId || data.sessionId || 'none'})`);

        // --- DISPATCH EVENT TYPES ---
        switch (event) {
          // 1. Session Initialization
          case 'session:init': {
            const { interviewId, candidateId, sessionId: requestedSessionId } = data;
            try {
              const session = await liveSessionManager.initializeSession({
                interviewId,
                candidateId,
                sessionId: requestedSessionId
              });

              socketToSession.set(ws, session.sessionId);

              sendEvent(ws, 'session:initialized', {
                sessionId: session.sessionId,
                candidateName: session.candidateName,
                roleTitle: session.roleTitle,
                introPhrase: session.introPhrase,
                totalQuestions: session.totalQuestions,
                currentQuestionIndex: session.currentQuestionIndex,
                currentQuestion: session.currentQuestion,
                state: session.state,
                isFollowUp: session.isFollowUp,
                conversationHistory: session.conversationHistory
              }, session.sessionId, eventId);
            } catch (err) {
              console.error('[LiveGateway] Session initialization error:', err.message);
              sendEvent(ws, 'session:error', {
                code: err.statusCode === 404 ? 'INTERVIEW_NOT_FOUND' : 'INITIALIZATION_FAILED',
                message: err.message,
                fatal: true
              }, requestedSessionId || 'none', eventId);
            }
            break;
          }

          // 2. Session Ready (Browser UI ready to receive AI intro)
          case 'session:ready': {
            const activeSessionId = sessionId || data.sessionId || socketToSession.get(ws);
            const session = liveSessionManager.getSession(activeSessionId);
            if (!session) {
              return sendEvent(ws, 'session:error', {
                code: 'SESSION_NOT_FOUND',
                message: 'No active session found matching the provided session ID',
                fatal: true
              }, activeSessionId, eventId);
            }

            // Move to INTRODUCTION / AI_SPEAKING state
            liveSessionManager.transitionState(activeSessionId, SESSION_STATES.INTRODUCTION);

            sendEvent(ws, 'ai:speaking', {
              phrase: session.introPhrase,
              phraseType: 'intro',
              questionIndex: 0,
              isFollowUp: false
            }, activeSessionId, eventId);
            break;
          }

          // 3. Interviewer Finished Speaking (Audio playback complete in browser)
          case 'interviewer:finished_speaking': {
            const activeSessionId = sessionId || data.sessionId || socketToSession.get(ws);
            const { phraseType } = data;
            const session = liveSessionManager.getSession(activeSessionId);
            if (!session) return;

            if (phraseType === 'intro') {
              // Transition from intro to asking first question
              const firstQ = session.questions[0] || session.currentQuestion;
              const questionPhrase = `Question 1: ${firstQ.text}`;
              
              liveSessionManager.transitionState(activeSessionId, SESSION_STATES.AI_SPEAKING);
              
              session.conversationHistory.push({
                role: 'ai',
                text: questionPhrase,
                timestamp: new Date().toISOString(),
                questionId: firstQ.id
              });

              sendEvent(ws, 'ai:speaking', {
                phrase: questionPhrase,
                phraseType: 'question',
                questionIndex: 0,
                question: firstQ,
                isFollowUp: false
              }, activeSessionId);
            } else if (phraseType === 'question' || phraseType === 'followup') {
              // Transition to LISTENING for candidate response
              liveSessionManager.transitionState(activeSessionId, SESSION_STATES.LISTENING);

              sendEvent(ws, 'candidate:turn', {
                state: SESSION_STATES.LISTENING,
                question: session.currentQuestion,
                questionIndex: session.currentQuestionIndex,
                isFollowUp: session.isFollowUp,
                followUpCount: session.followUpCount
              }, activeSessionId);
            } else if (phraseType === 'conclusion') {
              // AI concluded interview
              sendEvent(ws, 'interview:completed', {
                sessionId: activeSessionId,
                completed: true,
                interviewId: session.interviewId,
                candidateId: session.candidateId
              }, activeSessionId);
            }
            break;
          }

          // 4. Candidate Answer Submission
          case 'candidate:submit_answer': {
            const activeSessionId = sessionId || data.sessionId || socketToSession.get(ws);
            try {
              // Notify client that AI is processing/evaluating
              sendEvent(ws, 'session:state_change', {
                state: SESSION_STATES.AI_THINKING,
                previousState: SESSION_STATES.LISTENING
              }, activeSessionId);

              const turnResult = await liveSessionManager.processCandidateTurn(activeSessionId, {
                eventId,
                questionId: data.questionId,
                transcript: data.transcript,
                answerText: data.answerText,
                duration: data.duration || 60
              });

              if (turnResult.duplicate) {
                return sendEvent(ws, 'session:turn_ignored', {
                  reason: 'DUPLICATE_EVENT_DETECTED',
                  eventId
                }, activeSessionId);
              }

              // Send turn result (AI Evaluation + Next Action)
              sendEvent(ws, 'ai:response', {
                nextAction: turnResult.nextAction,
                evaluation: turnResult.evaluation,
                answerId: turnResult.answerId,
                phrase: turnResult.phrase,
                phraseType: turnResult.phraseType,
                question: turnResult.followUpQuestion || turnResult.nextQuestion || null,
                questionIndex: turnResult.currentQuestionIndex || turnResult.nextQuestionIndex || 0,
                isFollowUp: turnResult.isFollowUp || false,
                message: turnResult.message || null
              }, activeSessionId, eventId);

              // If next action is AI speech, trigger ai:speaking
              if (turnResult.phrase) {
                sendEvent(ws, 'ai:speaking', {
                  phrase: turnResult.phrase,
                  phraseType: turnResult.phraseType,
                  questionIndex: turnResult.currentQuestionIndex || turnResult.nextQuestionIndex || 0,
                  question: turnResult.followUpQuestion || turnResult.nextQuestion || null,
                  isFollowUp: turnResult.isFollowUp || false
                }, activeSessionId);
              }

              // If interview is complete
              if (turnResult.nextAction === 'COMPLETE') {
                sendEvent(ws, 'interview:completed', {
                  sessionId: activeSessionId,
                  completed: true,
                  report: turnResult.report,
                  interviewId: turnResult.interviewId,
                  candidateId: turnResult.candidateId,
                  phrase: turnResult.phrase
                }, activeSessionId);
              }
            } catch (err) {
              console.error('[LiveGateway] Turn processing error:', err);
              sendEvent(ws, 'session:error', {
                code: 'TURN_PROCESSING_FAILED',
                message: err.message,
                fatal: false
              }, activeSessionId, eventId);
            }
            break;
          }

          // 5. Session Reconnect / Resume
          case 'session:reconnect': {
            const { sessionId: requestedSessionId, interviewId, candidateId } = data;
            try {
              const session = await liveSessionManager.initializeSession({
                interviewId,
                candidateId,
                sessionId: requestedSessionId
              });

              socketToSession.set(ws, session.sessionId);

              console.log(`[LiveGateway] Reconnection successful for session: ${session.sessionId}`);

              sendEvent(ws, 'session:reconnected', {
                sessionId: session.sessionId,
                state: session.state,
                candidateName: session.candidateName,
                roleTitle: session.roleTitle,
                totalQuestions: session.totalQuestions,
                currentQuestionIndex: session.currentQuestionIndex,
                currentQuestion: session.currentQuestion,
                isFollowUp: session.isFollowUp,
                conversationHistory: session.conversationHistory,
                completed: session.completed
              }, session.sessionId, eventId);
            } catch (err) {
              console.error('[LiveGateway] Reconnection failed:', err.message);
              sendEvent(ws, 'session:error', {
                code: 'RECONNECT_FAILED',
                message: err.message,
                fatal: true
              }, requestedSessionId || 'none', eventId);
            }
            break;
          }

          // 6. Ping / Heartbeat
          case 'session:ping': {
            sendEvent(ws, 'session:pong', {
              serverTime: new Date().toISOString()
            }, sessionId || 'unassigned', eventId);
            break;
          }

          // 7. Manual End Assessment
          case 'session:end': {
            const activeSessionId = sessionId || data.sessionId || socketToSession.get(ws);
            try {
              const completeResult = await liveSessionManager.completeSession(activeSessionId);
              sendEvent(ws, 'interview:completed', {
                sessionId: activeSessionId,
                report: completeResult.report,
                interviewId: completeResult.interviewId,
                candidateId: completeResult.candidateId
              }, activeSessionId, eventId);
            } catch (err) {
              sendEvent(ws, 'session:error', {
                code: 'END_SESSION_FAILED',
                message: err.message,
                fatal: false
              }, activeSessionId, eventId);
            }
            break;
          }

          default:
            console.warn(`[LiveGateway] Unrecognized event received: ${event}`);
            sendEvent(ws, 'session:error', {
              code: 'UNKNOWN_EVENT',
              message: `Unknown event: ${event}`,
              fatal: false
            }, sessionId || 'unassigned', eventId);
        }
      } catch (parseErr) {
        console.error('[LiveGateway] Message parse error:', parseErr.message);
        sendEvent(ws, 'session:error', {
          code: 'MALFORMED_JSON',
          message: 'Failed to parse JSON message',
          fatal: false
        });
      }
    });

    ws.on('close', (code, reason) => {
      const activeSessionId = socketToSession.get(ws);
      console.log(`[LiveGateway] WebSocket disconnected (Code: ${code}, Reason: ${reason || 'normal'}) for session: ${activeSessionId || 'none'}`);
      if (activeSessionId) {
        liveSessionManager.handleDisconnect(activeSessionId);
      }
    });

    ws.on('error', (err) => {
      console.error('[LiveGateway] WebSocket error:', err.message);
    });
  });

  return wss;
};

export default initLiveWebSocket;
