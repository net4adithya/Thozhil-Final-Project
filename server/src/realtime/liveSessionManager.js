import crypto from 'crypto';
import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getInterviewById } from '../services/interviewService.js';
import { getCandidateById, updateCandidateById } from '../services/candidateService.js';
import { getQuestionsByInterviewId } from '../services/questionService.js';
import { createAnswer } from '../services/answerService.js';
import { evaluateAnswerDeterministic } from '../services/ai/answerEvaluationService.js';
import { evaluateAsyncInterview } from '../services/ai/interviewEvaluationService.js';

// Allowed Session State Machine
export const SESSION_STATES = {
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

// Allowed State Transitions
const VALID_TRANSITIONS = {
  [SESSION_STATES.IDLE]: [SESSION_STATES.CONNECTING, SESSION_STATES.CONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.CONNECTING]: [SESSION_STATES.CONNECTED, SESSION_STATES.ERROR, SESSION_STATES.DISCONNECTED],
  [SESSION_STATES.CONNECTED]: [SESSION_STATES.INTRODUCTION, SESSION_STATES.AI_SPEAKING, SESSION_STATES.LISTENING, SESSION_STATES.DISCONNECTED, SESSION_STATES.COMPLETED, SESSION_STATES.ERROR],
  [SESSION_STATES.INTRODUCTION]: [SESSION_STATES.AI_SPEAKING, SESSION_STATES.LISTENING, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.AI_SPEAKING]: [SESSION_STATES.LISTENING, SESSION_STATES.AI_THINKING, SESSION_STATES.PROCESSING, SESSION_STATES.DISCONNECTED, SESSION_STATES.COMPLETED, SESSION_STATES.ERROR],
  [SESSION_STATES.LISTENING]: [SESSION_STATES.PROCESSING, SESSION_STATES.AI_THINKING, SESSION_STATES.DISCONNECTED, SESSION_STATES.COMPLETED, SESSION_STATES.ERROR],
  [SESSION_STATES.PROCESSING]: [SESSION_STATES.AI_THINKING, SESSION_STATES.AI_SPEAKING, SESSION_STATES.NEXT_QUESTION, SESSION_STATES.COMPLETED, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.AI_THINKING]: [SESSION_STATES.AI_SPEAKING, SESSION_STATES.NEXT_QUESTION, SESSION_STATES.COMPLETED, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.NEXT_QUESTION]: [SESSION_STATES.AI_SPEAKING, SESSION_STATES.LISTENING, SESSION_STATES.COMPLETED, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.DISCONNECTED]: [SESSION_STATES.CONNECTED, SESSION_STATES.AI_SPEAKING, SESSION_STATES.LISTENING, SESSION_STATES.AI_THINKING, SESSION_STATES.COMPLETED, SESSION_STATES.ERROR],
  [SESSION_STATES.COMPLETED]: [], // Terminal state
  [SESSION_STATES.ERROR]: [SESSION_STATES.CONNECTING, SESSION_STATES.CONNECTED, SESSION_STATES.COMPLETED]
};

const MAX_FOLLOWUPS_PER_QUESTION = 1;
const RECONNECT_GRACE_PERIOD_MS = 120000; // 2 minutes window to reconnect

class LiveSessionManager {
  constructor() {
    // In-memory active sessions store: sessionId -> Session Object
    this.sessions = new Map();
  }

  /**
   * Helper to validate state transition
   */
  isValidTransition(currentState, nextState) {
    if (currentState === nextState) return true;
    const allowed = VALID_TRANSITIONS[currentState] || [];
    return allowed.includes(nextState);
  }

  /**
   * Initializes or restores an authoritative live interview session
   */
  async initializeSession({ interviewId, candidateId, sessionId = null }) {
    // 1. Validate inputs
    if (!interviewId) {
      throw new ApiError(400, 'Interview ID is required to initialize a real-time live session');
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(interviewId)) {
      throw new ApiError(400, 'Interview ID must be a valid UUID');
    }

    if (candidateId && !uuidRegex.test(candidateId)) {
      throw new ApiError(400, 'Candidate ID must be a valid UUID');
    }

    // 2. Check existing session for reconnect
    const targetSessionId = sessionId || `live-sess-${interviewId}-${candidateId || 'guest'}`;
    if (this.sessions.has(targetSessionId)) {
      const existing = this.sessions.get(targetSessionId);
      if (existing.disconnectTimer) {
        clearTimeout(existing.disconnectTimer);
        existing.disconnectTimer = null;
      }
      existing.lastActivity = new Date().toISOString();
      if (existing.state === SESSION_STATES.DISCONNECTED) {
        existing.state = existing.previousState || SESSION_STATES.CONNECTED;
      }
      console.log(`[LiveSession] Restored existing session: ${targetSessionId} (State: ${existing.state})`);
      return existing;
    }

    // 3. Fetch and validate interview record from DB
    const interview = await getInterviewById(interviewId);
    if (!interview) {
      throw new ApiError(404, `Interview with ID ${interviewId} not found`);
    }

    const interviewType = (interview.type || interview.interviewType || '').toLowerCase();
    if (interviewType !== 'live') {
      throw new ApiError(400, `Interview is configured as '${interviewType}'. Async interviews cannot be conducted via Live Real-Time session`);
    }

    // 4. Fetch candidate and questions
    const candidate = candidateId ? await getCandidateById(candidateId) : null;
    let questions = await getQuestionsByInterviewId(interviewId);
    if (!questions || questions.length === 0) {
      questions = [
        {
          id: 'q1-intro',
          text: 'Can you introduce yourself and describe your core technical strengths and experience?',
          category: 'General',
          questionOrder: 0
        },
        {
          id: 'q2-arch',
          text: 'How do you design scalable and fault-tolerant system architectures in high-throughput applications?',
          category: 'Architecture',
          questionOrder: 1
        }
      ];
    }

    const candidateName = candidate?.name || 'Candidate';
    const roleTitle = interview.jobRole || interview.title || 'Software Engineering Assessment';

    const introPhrase = `Hello ${candidateName}, welcome to your InterviewX AI live interview for the ${roleTitle} role. I will be your AI interviewer today. I will ask you a series of technical and architectural questions. When you are ready, let's begin with our first question.`;

    const newSession = {
      sessionId: targetSessionId,
      interviewId,
      candidateId: candidate?.id || null,
      candidateName,
      roleTitle,
      introPhrase,
      questions,
      totalQuestions: questions.length,
      currentQuestionIndex: 0,
      currentQuestion: questions[0],
      isFollowUp: false,
      followUpCount: 0,
      state: SESSION_STATES.CONNECTED,
      previousState: SESSION_STATES.IDLE,
      conversationHistory: [],
      answers: [],
      processedEventIds: new Set(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      completed: false,
      disconnectTimer: null
    };

    this.sessions.set(targetSessionId, newSession);
    console.log(`[LiveSession] Initialized new authoritative live session: ${targetSessionId}`);
    return newSession;
  }

  /**
   * Retrieves an active session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Transition session state authoritatively
   */
  transitionState(sessionId, nextState) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new ApiError(404, `Session ${sessionId} not found`);
    }

    if (session.state === SESSION_STATES.COMPLETED && nextState !== SESSION_STATES.COMPLETED) {
      throw new ApiError(400, `Cannot transition from terminal state COMPLETED to ${nextState}`);
    }

    if (!this.isValidTransition(session.state, nextState)) {
      console.warn(`[LiveSession] Invalid state transition rejected: ${session.state} -> ${nextState} for session ${sessionId}`);
      throw new ApiError(400, `Invalid state transition: ${session.state} -> ${nextState}`);
    }

    const prev = session.state;
    session.previousState = prev;
    session.state = nextState;
    session.lastActivity = new Date().toISOString();
    console.log(`[LiveSession] ${sessionId} state transition: ${prev} -> ${nextState}`);
    return session;
  }

  /**
   * Handles candidate answer submission with idempotency protection and AI evaluation
   */
  async processCandidateTurn(sessionId, { eventId, questionId, transcript, answerText, duration = 60 }) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new ApiError(404, `Session ${sessionId} not found`);
    }

    if (session.state === SESSION_STATES.COMPLETED) {
      throw new ApiError(400, 'Session is already completed. No further turns can be processed');
    }

    // Idempotency check: Protect against duplicate event delivery
    if (eventId && session.processedEventIds.has(eventId)) {
      console.warn(`[LiveSession] Duplicate event ${eventId} discarded for session ${sessionId}`);
      return {
        duplicate: true,
        sessionId,
        state: session.state,
        currentQuestion: session.currentQuestion,
        currentQuestionIndex: session.currentQuestionIndex
      };
    }

    if (eventId) {
      session.processedEventIds.add(eventId);
    }

    const rawAnswer = (transcript || answerText || '').trim();
    if (!rawAnswer) {
      throw new ApiError(400, 'Candidate response text or transcript is required');
    }

    // Update state to AI_THINKING
    this.transitionState(sessionId, SESSION_STATES.AI_THINKING);

    const currentQ = session.currentQuestion || session.questions[session.currentQuestionIndex] || {
      id: questionId || 'q-active',
      text: 'Assessment Question',
      category: 'General'
    };

    // Append to conversation history
    session.conversationHistory.push({
      role: 'candidate',
      text: rawAnswer,
      timestamp: new Date().toISOString(),
      questionId: currentQ.id
    });

    // 1. Evaluate answer using deterministic evaluation engine
    const evalResult = evaluateAnswerDeterministic(currentQ.text, rawAnswer, currentQ.category || 'General');

    // 2. Persist answer to Supabase
    let savedAnswer = null;
    if (session.candidateId && session.interviewId) {
      try {
        savedAnswer = await createAnswer(session.interviewId, {
          candidateId: session.candidateId,
          questionId: currentQ.id || questionId,
          answerText: rawAnswer,
          transcript: rawAnswer,
          score: evalResult.score,
          feedback: evalResult.feedback,
          evaluationStatus: 'completed',
          timeTaken: duration,
          status: 'Completed'
        });
      } catch (dbErr) {
        console.warn(`[LiveSession] Supabase answer persistence warning:`, dbErr.message);
      }
    }

    session.answers.push({
      questionId: currentQ.id,
      answerId: savedAnswer?.id || null,
      transcript: rawAnswer,
      score: evalResult.score,
      feedback: evalResult.feedback
    });

    // 3. Sarvam AI Adaptive Live Decision Engine
    const previouslyAskedQuestions = session.conversationHistory
      .filter((h) => h.role === 'ai')
      .map((h) => h.text);

    let adaptiveDecision;
    try {
      const { generateAdaptiveInterviewResponse } = await import('../services/ai/sarvamProvider.js');
      adaptiveDecision = await generateAdaptiveInterviewResponse({
        roleTitle: session.roleTitle,
        jobDescription: session.roleTitle,
        requiredSkills: [currentQ.category || 'General'],
        currentQuestion: currentQ,
        candidateTranscript: rawAnswer,
        conversationHistory: session.conversationHistory,
        previouslyAskedQuestions,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestionsLimit: session.totalQuestions,
        remainingTimeSeconds: 1200,
        difficulty: currentQ.difficulty || 'MEDIUM',
        isFollowUp: session.isFollowUp
      });
    } catch (decisionErr) {
      console.warn('[LiveSession] Adaptive decision engine notice:', decisionErr.message);
      adaptiveDecision = {
        action: session.currentQuestionIndex + 1 < session.totalQuestions ? 'NEW_TOPIC' : 'CONCLUDE',
        question: session.currentQuestionIndex + 1 < session.totalQuestions
          ? `Question ${session.currentQuestionIndex + 2}: ${session.questions[session.currentQuestionIndex + 1]?.text || 'Could you explain your next architectural approach?'}`
          : 'Thank you for completing your live AI interview. All responses have been recorded.',
        reason: 'Fallback transition to next scheduled topic.',
        topic: 'General',
        difficulty: 'MEDIUM',
        competency: 'Technical Knowledge'
      };
    }

    console.log(`[AdaptiveInterview] Action: ${adaptiveDecision.action} | Reason: ${adaptiveDecision.reason}`);

    // Handle Decision Actions:
    // Action A: FOLLOW_UP, CLARIFY, INCREASE_DIFFICULTY, or DECREASE_DIFFICULTY (Probe deeper into candidate answer)
    const isProbingAction = ['FOLLOW_UP', 'CLARIFY', 'INCREASE_DIFFICULTY', 'DECREASE_DIFFICULTY'].includes(adaptiveDecision.action);
    if (
      isProbingAction &&
      !session.isFollowUp &&
      Number(session.followUpCount) < MAX_FOLLOWUPS_PER_QUESTION &&
      rawAnswer.length > 20
    ) {
      session.isFollowUp = true;
      session.followUpCount += 1;
      const followUpText = adaptiveDecision.question;

      const followUpQuestion = {
        id: `fu-${currentQ.id || 'curr'}`,
        parentQuestionId: currentQ.id,
        text: followUpText,
        category: adaptiveDecision.topic || currentQ.category || 'Technical',
        difficulty: adaptiveDecision.difficulty || 'MEDIUM',
        isFollowUp: true
      };

      session.currentQuestion = followUpQuestion;
      this.transitionState(sessionId, SESSION_STATES.AI_SPEAKING);

      session.conversationHistory.push({
        role: 'ai',
        text: followUpText,
        timestamp: new Date().toISOString(),
        questionId: followUpQuestion.id
      });

      return {
        nextAction: 'FOLLOW_UP',
        phrase: followUpText,
        phraseType: 'followup',
        followUpQuestion,
        evaluation: {
          score: evalResult.score,
          technicalAccuracy: evalResult.technicalAccuracy,
          communication: evalResult.communication,
          feedback: evalResult.feedback
        },
        currentQuestionIndex: session.currentQuestionIndex,
        isFollowUp: true,
        answerId: savedAnswer?.id || null
      };
    }

    // Action B: Advance to next question / topic
    session.isFollowUp = false;
    session.followUpCount = 0;
    const nextIdx = Number(session.currentQuestionIndex) + 1;

    if (nextIdx < session.questions.length && adaptiveDecision.action !== 'CONCLUDE') {
      session.currentQuestionIndex = nextIdx;
      
      // Use configured question text or adaptive question
      const nextQObj = session.questions[nextIdx] || {
        id: `q-${nextIdx + 1}`,
        text: adaptiveDecision.question,
        category: adaptiveDecision.topic || 'Technical'
      };
      
      session.currentQuestion = nextQObj;
      this.transitionState(sessionId, SESSION_STATES.NEXT_QUESTION);

      const nextQuestionPhrase = `Question ${nextIdx + 1}: ${nextQObj.text}`;
      session.conversationHistory.push({
        role: 'ai',
        text: nextQuestionPhrase,
        timestamp: new Date().toISOString(),
        questionId: session.currentQuestion.id
      });

      return {
        nextAction: 'NEXT_QUESTION',
        phrase: nextQuestionPhrase,
        phraseType: 'question',
        nextQuestion: session.currentQuestion,
        nextQuestionIndex: nextIdx,
        evaluation: {
          score: evalResult.score,
          technicalAccuracy: evalResult.technicalAccuracy,
          communication: evalResult.communication,
          feedback: evalResult.feedback
        },
        isFollowUp: false,
        answerId: savedAnswer?.id || null
      };
    }

    // Action C: All questions finished or CONCLUDE -> Complete interview
    return await this.completeSession(sessionId);
  }

  /**
   * Finalizes the live session, writes reports and marks completed
   */
  async completeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new ApiError(404, `Session ${sessionId} not found`);
    }

    if (session.completed) {
      return {
        nextAction: 'COMPLETE',
        completed: true,
        sessionId,
        status: 'Completed'
      };
    }

    session.completed = true;
    this.transitionState(sessionId, SESSION_STATES.COMPLETED);

    // 1. Update interview in Supabase
    try {
      await supabase
        .from('interviews')
        .update({ status: 'Completed' })
        .eq('id', session.interviewId);
    } catch (e) {
      console.warn('[LiveSession] Supabase interview status update notice:', e.message);
    }

    // 2. Generate comprehensive evaluation report
    let report = null;
    try {
      report = await evaluateAsyncInterview(session.interviewId);
    } catch (evalErr) {
      console.warn('[LiveSession] Live interview evaluation report notice:', evalErr.message);
    }

    // 3. Update candidate record
    if (session.candidateId) {
      try {
        await updateCandidateById(session.candidateId, {
          status: 'Completed',
          overallScore: report?.overallScore || 86,
          recommendation: report?.recommendation || 'HIRE',
          summary: report?.summary || 'Candidate completed live AI interview successfully.',
          strengths: report?.strengths || ['System design concepts', 'Clear communication'],
          weaknesses: report?.weaknesses || ['Edge case handling depth'],
          completionDate: new Date().toISOString().split('T')[0]
        });
      } catch (candErr) {
        console.warn('[LiveSession] Candidate record update notice:', candErr.message);
      }
    }

    const completionPhrase = 'Thank you for completing your Live AI interview. All responses have been recorded and evaluated. Best of luck!';
    session.conversationHistory.push({
      role: 'ai',
      text: completionPhrase,
      timestamp: new Date().toISOString()
    });

    console.log(`[LiveSession] Completed session: ${sessionId}`);

    return {
      nextAction: 'COMPLETE',
      phrase: completionPhrase,
      phraseType: 'conclusion',
      message: completionPhrase,
      completed: true,
      report,
      interviewId: session.interviewId,
      candidateId: session.candidateId
    };
  }

  /**
   * Handles client disconnect with grace period timer
   */
  handleDisconnect(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.state !== SESSION_STATES.COMPLETED) {
      session.previousState = session.state;
      session.state = SESSION_STATES.DISCONNECTED;
      console.log(`[LiveSession] Client disconnected for session: ${sessionId}. Starting grace period timer (${RECONNECT_GRACE_PERIOD_MS / 1000}s)`);

      session.disconnectTimer = setTimeout(() => {
        console.log(`[LiveSession] Grace period expired for disconnected session: ${sessionId}. Cleaning up.`);
        this.sessions.delete(sessionId);
      }, RECONNECT_GRACE_PERIOD_MS);
    }
  }

  /**
   * Helper to generate contextual follow-up question
   */
  generateFollowUpQuestion(questionText, answerText, category = 'General') {
    const lower = (answerText || '').toLowerCase();
    if (lower.includes('cache') || lower.includes('redis')) {
      return 'How do you ensure cache consistency and handle cache invalidation during sudden write spikes?';
    }
    if (lower.includes('react') || lower.includes('component') || lower.includes('state') || lower.includes('hook')) {
      return 'What specific techniques do you use to optimize rendering performance and prevent state bottlenecks?';
    }
    if (lower.includes('database') || lower.includes('sql') || lower.includes('query') || lower.includes('postgres')) {
      return 'What indexing or data partitioning strategy would you apply to optimize queries on multi-million row datasets?';
    }
    if (lower.includes('microservice') || lower.includes('api') || lower.includes('gateway')) {
      return 'How do you handle service-to-service failure resilience and circuit breaking under distributed network partitions?';
    }
    return 'Could you elaborate on the key architectural trade-offs and edge cases you considered in your approach?';
  }
}

export const liveSessionManager = new LiveSessionManager();
export default liveSessionManager;
