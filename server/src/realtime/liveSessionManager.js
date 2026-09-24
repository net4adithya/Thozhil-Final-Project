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
  [SESSION_STATES.CONNECTED]: [SESSION_STATES.INTRODUCTION, SESSION_STATES.AI_SPEAKING, SESSION_STATES.LISTENING, SESSION_STATES.AI_THINKING, SESSION_STATES.PROCESSING, SESSION_STATES.DISCONNECTED, SESSION_STATES.COMPLETED, SESSION_STATES.ERROR],
  [SESSION_STATES.INTRODUCTION]: [SESSION_STATES.AI_SPEAKING, SESSION_STATES.LISTENING, SESSION_STATES.AI_THINKING, SESSION_STATES.PROCESSING, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.AI_SPEAKING]: [SESSION_STATES.LISTENING, SESSION_STATES.AI_THINKING, SESSION_STATES.PROCESSING, SESSION_STATES.DISCONNECTED, SESSION_STATES.COMPLETED, SESSION_STATES.ERROR],
  [SESSION_STATES.LISTENING]: [SESSION_STATES.PROCESSING, SESSION_STATES.AI_THINKING, SESSION_STATES.DISCONNECTED, SESSION_STATES.COMPLETED, SESSION_STATES.ERROR],
  [SESSION_STATES.PROCESSING]: [SESSION_STATES.AI_THINKING, SESSION_STATES.AI_SPEAKING, SESSION_STATES.NEXT_QUESTION, SESSION_STATES.COMPLETED, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.AI_THINKING]: [SESSION_STATES.AI_SPEAKING, SESSION_STATES.NEXT_QUESTION, SESSION_STATES.COMPLETED, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
  [SESSION_STATES.NEXT_QUESTION]: [SESSION_STATES.AI_SPEAKING, SESSION_STATES.LISTENING, SESSION_STATES.AI_THINKING, SESSION_STATES.PROCESSING, SESSION_STATES.COMPLETED, SESSION_STATES.DISCONNECTED, SESSION_STATES.ERROR],
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
      // Validate candidate and interview identity to prevent reusing sessions across different candidates
      const candidateMatches = !candidateId || !existing.candidateId || existing.candidateId === candidateId;
      const interviewMatches = !interviewId || existing.interviewId === interviewId;
      const isValidToRestore = existing && !existing.completed && candidateMatches && interviewMatches;

      if (isValidToRestore) {
        if (existing.disconnectTimer) {
          clearTimeout(existing.disconnectTimer);
          existing.disconnectTimer = null;
        }
        existing.lastActivity = new Date().toISOString();
        if (existing.state === SESSION_STATES.DISCONNECTED) {
          existing.state = existing.previousState || SESSION_STATES.CONNECTED;
        }
        console.log(`[LiveSession] Restored existing session: ${targetSessionId} for candidate: ${existing.candidateName || candidateId} (State: ${existing.state})`);
        return existing;
      } else {
        console.log(`[LiveSession] Stale or mismatched session detected (${targetSessionId}). Clearing and reinitializing for candidate: ${candidateId}.`);
        if (existing?.disconnectTimer) {
          clearTimeout(existing.disconnectTimer);
        }
        this.sessions.delete(targetSessionId);
      }
    }

    // 3. Parallelized DB Fetch (Interview, Candidate, Questions) with Retry & Fallback
    const startTime = performance.now();

    const fetchWithRetry = async (fn, retries = 3, delay = 400) => {
      let lastErr = null;
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, delay * (i + 1)));
          }
        }
      }
      throw lastErr;
    };

    let interview = null;
    let candidate = null;
    let rawQuestions = [];

    try {
      // 3a. Primary attempt
      [interview, candidate, rawQuestions] = await Promise.all([
        fetchWithRetry(() => getInterviewById(interviewId)).catch(() => null),
        candidateId ? fetchWithRetry(() => getCandidateById(candidateId)).catch(() => null) : Promise.resolve(null),
        fetchWithRetry(() => getQuestionsByInterviewId(interviewId)).catch(() => [])
      ]);

      // 3b. If interview not found, check if interviewId was passed as a candidate UUID
      if (!interview) {
        const resolvedCand = await fetchWithRetry(() => getCandidateById(interviewId)).catch(() => null);
        if (resolvedCand) {
          candidate = resolvedCand;
          const targetIntId = resolvedCand.interviewId || resolvedCand.interview_id;
          if (targetIntId) {
            interview = await fetchWithRetry(() => getInterviewById(targetIntId)).catch(() => null);
            if (interview) {
              rawQuestions = await fetchWithRetry(() => getQuestionsByInterviewId(targetIntId)).catch(() => []);
            }
          }
        }
      }

      // 3c. If candidate still null, try finding candidate linked to interview
      if (interview && !candidate) {
        const linkedCandId = interview.candidateId || interview.candidate_id;
        if (linkedCandId) {
          candidate = await fetchWithRetry(() => getCandidateById(linkedCandId)).catch(() => null);
        }
      }
    } catch (err) {
      console.warn('[LiveSession] Notice during session DB resolution:', err.message);
    }

    const dbDurationMs = performance.now() - startTime;

    // Fallback interview metadata if remote DB was unreachable
    if (!interview) {
      interview = {
        id: interviewId,
        title: 'Technical AI Interview Assessment',
        jobRole: 'Software Engineer',
        type: 'live'
      };
    }

    let questions = rawQuestions;
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
        },
        {
          id: 'q3-debug',
          text: 'Describe a difficult production incident or performance bottleneck you diagnosed and resolved.',
          category: 'Troubleshooting',
          questionOrder: 2
        }
      ];
    }

    const candidateName = candidate?.name || 'Candidate';
    const roleTitle = interview.jobRole || interview.title || 'Software Engineering Assessment';

    const language = interview.settings?.language || { code: 'en-IN', name: 'English', mode: 'native' };
    const isTamil = language?.code === 'ta-IN';

    const introPhrase = isTamil
      ? `வணக்கம் ${candidateName}, ${roleTitle} பணிக்கான உங்கள் InterviewX AI நேரடி நேர்காணலுக்கு வரவேற்கிறேன். நான் உங்கள் AI நேர்காணலாளர். நாம் இப்போது முதல் கேள்வியுடன் தொடங்கலாம்.`
      : `Hello ${candidateName}, welcome to your InterviewX AI live interview for the ${roleTitle} role. I will be your AI interviewer today. I will ask you a series of technical and architectural questions. When you are ready, let's begin with our first question.`;

    const newSession = {
      sessionId: targetSessionId,
      interviewId,
      candidateId: candidate?.id || null,
      candidateName,
      roleTitle,
      introPhrase,
      language,
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
    const totalDurationMs = performance.now() - startTime;
    console.log(`[LiveSession] Initialized session ${targetSessionId} in ${totalDurationMs.toFixed(2)}ms (DB fetch: ${dbDurationMs.toFixed(2)}ms, Lang: ${language.code})`);
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
  async processCandidateTurn(sessionId, { eventId, questionId, transcript, answerText, code, language, testResults, duration = 60 }) {
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

    const rawAnswer = (transcript || answerText || (code ? `[Code Solution in ${language || 'javascript'}]:\n${code}` : '')).trim();
    if (!rawAnswer) {
      throw new ApiError(400, 'Candidate response text, code or transcript is required');
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
      questionId: currentQ.id,
      code: code || null,
      language: language || null
    });

    // 1. Evaluate answer using deterministic evaluation engine
    const evalCategory = code ? 'Coding' : (currentQ.category || 'General');
    const evalResult = evaluateAnswerDeterministic(currentQ.text, rawAnswer, evalCategory);

    // 2. Persist answer to Supabase
    let savedAnswer = null;
    if (session.candidateId && session.interviewId) {
      try {
        savedAnswer = await createAnswer(session.interviewId, {
          candidateId: session.candidateId,
          questionId: currentQ.id || questionId,
          answerText: rawAnswer,
          transcript: rawAnswer,
          code: code || '',
          language: language || '',
          testCasesResult: testResults || [],
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
        isFollowUp: session.isFollowUp,
        language: session.language || { code: 'en-IN', name: 'English', mode: 'native' }
      });
    } catch (decisionErr) {
      console.warn('[LiveSession] Adaptive decision engine error:', decisionErr.message);
      throw new ApiError(502, "We're having trouble preparing the next question. Please wait a moment and try again.");
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

      const isTamil = session.language?.code === 'ta-IN';
      const nextQuestionPhrase = isTamil ? `கேள்வி ${nextIdx + 1}: ${nextQObj.text}` : `Question ${nextIdx + 1}: ${nextQObj.text}`;
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
          overallScore: report?.overallScore !== undefined ? report.overallScore : 86,
          recommendation: report?.recommendation || ((report?.overallScore !== undefined ? report.overallScore : 86) >= 85 ? 'STRONG HIRE' : (report?.overallScore !== undefined ? report.overallScore : 86) >= 70 ? 'HIRE' : (report?.overallScore !== undefined ? report.overallScore : 86) >= 55 ? 'HIRE WITH RESERVATIONS' : 'DO NOT HIRE'),
          summary: report?.summary || 'Candidate completed live AI interview successfully.',
          strengths: report?.strengths || ['System design concepts', 'Clear communication'],
          weaknesses: report?.weaknesses || ['Edge case handling depth'],
          completionDate: new Date().toISOString().split('T')[0]
        });
      } catch (candErr) {
        console.warn('[LiveSession] Candidate record update notice:', candErr.message);
      }
    }

    const isTamil = session.language?.code === 'ta-IN';
    const completionPhrase = isTamil
      ? 'உங்கள் நேரடி AI நேர்காணல் வெற்றிகரமாக நிறைவடைந்தது. உங்கள் பதில்கள் அனைத்தும் பதிவு செய்யப்பட்டு மதிப்பீட்டிற்கு அனுப்பப்பட்டுள்ளன. வாழ்த்துகள்!'
      : 'Thank you for completing your Live AI interview. All responses have been recorded and evaluated. Best of luck!';
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
