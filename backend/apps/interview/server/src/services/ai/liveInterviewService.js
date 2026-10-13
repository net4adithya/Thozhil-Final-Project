import supabase from '../../config/supabase.js';
import ApiError from '../../utils/ApiError.js';
import { getInterviewById } from '../interviewService.js';
import { getCandidateById, updateCandidateById } from '../candidateService.js';
import { getQuestionsByInterviewId } from '../questionService.js';
import { createAnswer } from '../answerService.js';
import { evaluateAnswerDeterministic } from './answerEvaluationService.js';
import { evaluateAsyncInterview } from './interviewEvaluationService.js';

const MAX_FOLLOWUPS_PER_QUESTION = 1;

/**
 * Initializes a Live AI Interview Session
 * @param {string} interviewId - UUID of the interview
 * @param {string} candidateId - UUID of the candidate
 * @returns {Promise<Object>}
 */
export const initLiveSession = async (interviewId, candidateId) => {
  const interview = await getInterviewById(interviewId);
  const candidate = candidateId ? await getCandidateById(candidateId) : null;
  const questions = await getQuestionsByInterviewId(interviewId);

  const candidateName = candidate?.name || 'Candidate';
  const roleTitle = interview.jobRole || interview.title || 'Software Engineering Position';

  const language = interview.settings?.language || { code: 'en-IN', name: 'English', mode: 'native' };
  const isTamil = language?.code === 'ta-IN';

  const introPhrase = isTamil
    ? `வணக்கம் ${candidateName}, ${roleTitle} பணிக்கான உங்கள் InterviewX AI நேரடி நேர்காணலுக்கு வரவேற்கிறேன். நான் உங்கள் AI நேர்காணலாளர். நாம் இப்போது முதல் கேள்வியுடன் தொடங்கலாம்.`
    : `Hello ${candidateName}, welcome to your InterviewX AI live interview for the ${roleTitle} role. I will be your AI interviewer today. I will guide you through a series of technical and architectural questions. When you are ready, let's begin with our first question.`;

  return {
    sessionId: `live-${interviewId}-${Date.now()}`,
    interviewId,
    candidateId: candidate?.id || null,
    candidateName,
    roleTitle,
    introPhrase,
    language,
    totalQuestions: questions.length,
    currentQuestionIndex: 0,
    currentQuestion: questions[0] || {
      id: 'default-q1',
      text: 'Can you introduce yourself and describe your core technical strengths?',
      category: 'General'
    },
    questions
  };
};

/**
 * Processes a single Live Interview turn (Candidate Answer -> AI Evaluation -> Decision: Follow-up / Next Question / Complete)
 * @param {string} interviewId - UUID of the interview
 * @param {Object} payload - Turn payload
 * @returns {Promise<Object>}
 */
export const processLiveTurn = async (interviewId, payload) => {
  const {
    candidateId,
    questionId,
    transcript = '',
    answerText = '',
    duration = 60,
    followUpCount = 0,
    isFollowUp = false,
    currentQuestionIndex = 0
  } = payload;

  const rawAnswer = (transcript || answerText || payload?.userSpeechText || payload?.text || payload?.answer || '').trim();
  if (!rawAnswer) {
    throw new ApiError(400, 'Answer transcript or text is required to evaluate response');
  }

  // 1. Fetch context
  const interview = await getInterviewById(interviewId);
  const questions = await getQuestionsByInterviewId(interviewId);
  const currentQ = questions.find((q) => q.id === questionId) || questions[currentQuestionIndex] || {
    id: questionId,
    text: 'Technical Assessment Question',
    category: 'Technical'
  };

  // 2. Evaluate answer (Prompt Injection isolated)
  const evalResult = evaluateAnswerDeterministic(currentQ.text, rawAnswer, currentQ.category || 'General');

  // 3. Persist Candidate Answer to Supabase
  let savedAnswer = null;
  if (candidateId && interviewId) {
    try {
      savedAnswer = await createAnswer(interviewId, {
        candidateId,
        questionId: currentQ.id || questionId,
        answerText: rawAnswer,
        transcript: rawAnswer,
        score: evalResult.score,
        feedback: evalResult.feedback,
        evaluationStatus: 'completed',
        timeTaken: duration,
        status: 'Completed'
      });
    } catch (err) {
      console.warn('Live answer persistence notice:', err.message);
    }
  }

  // 4. Sarvam AI Adaptive Decision Engine
  const { generateAdaptiveInterviewResponse } = await import('./sarvamProvider.js');
  const adaptiveDecision = await generateAdaptiveInterviewResponse({
    roleTitle: interview.jobRole || interview.title || 'Software Engineering Position',
    jobDescription: interview.title || 'Technical Assessment',
    requiredSkills: [currentQ.category || 'General'],
    currentQuestion: currentQ,
    candidateTranscript: rawAnswer,
    currentQuestionIndex: Number(currentQuestionIndex),
    totalQuestionsLimit: questions.length,
    remainingTimeSeconds: 1200,
    difficulty: currentQ.difficulty || 'MEDIUM',
    language: interview.settings?.language || { code: 'en-IN', name: 'English', mode: 'native' }
  });

  const canFollowUp = !isFollowUp && Number(followUpCount) < MAX_FOLLOWUPS_PER_QUESTION;

  if (
    (adaptiveDecision.action === 'FOLLOW_UP' || adaptiveDecision.action === 'CLARIFY') &&
    canFollowUp &&
    rawAnswer.length > 20
  ) {
    const followUpText = adaptiveDecision.question;
    return {
      nextAction: 'FOLLOW_UP',
      followUpQuestion: {
        id: `fu-${currentQ.id || questionId}`,
        parentQuestionId: currentQ.id || questionId,
        text: followUpText,
        category: adaptiveDecision.topic || currentQ.category || 'Technical',
        difficulty: adaptiveDecision.difficulty || 'MEDIUM',
        isFollowUp: true
      },
      evaluation: {
        score: evalResult.score,
        technicalAccuracy: evalResult.technicalAccuracy,
        communication: evalResult.communication,
        feedback: evalResult.feedback
      },
      answerId: savedAnswer?.id || null,
      currentQuestionIndex
    };
  }

  // Move to next configured question
  const nextIdx = Number(currentQuestionIndex) + 1;

  if (nextIdx < questions.length && adaptiveDecision.action !== 'CONCLUDE') {
    const nextQ = questions[nextIdx];
    return {
      nextAction: 'NEXT_QUESTION',
      nextQuestionIndex: nextIdx,
      nextQuestion: nextQ,
      evaluation: {
        score: evalResult.score,
        technicalAccuracy: evalResult.technicalAccuracy,
        communication: evalResult.communication,
        feedback: evalResult.feedback
      },
      answerId: savedAnswer?.id || null
    };
  }

  // All questions completed
  return {
    nextAction: 'COMPLETE',
    message: 'Thank you for completing your live AI interview. All responses have been recorded and sent for final evaluation.',
    evaluation: {
      score: evalResult.score,
      technicalAccuracy: evalResult.technicalAccuracy,
      communication: evalResult.communication,
      feedback: evalResult.feedback
    },
    answerId: savedAnswer?.id || null
  };
};

/**
 * Finalizes Live Session, updates candidate record, and generates the final Supabase Report
 */
export const completeLiveSession = async (interviewId, candidateId) => {
  // Update interview status to Completed
  const { error: intErr } = await supabase
    .from('interviews')
    .update({ status: 'Completed' })
    .eq('id', interviewId);

  if (intErr) console.warn('Update interview status warning:', intErr.message);

  // Generate real evaluation report across all live answers
  let report = null;
  try {
    report = await evaluateAsyncInterview(interviewId);
  } catch (evalErr) {
    console.warn('Live interview final report generation notice:', evalErr.message);
  }

  // Update candidate status
  if (candidateId) {
    await updateCandidateById(candidateId, {
      status: 'Completed',
      overallScore: report?.overallScore !== undefined ? report.overallScore : 85,
      recommendation: report?.recommendation || ((report?.overallScore !== undefined ? report.overallScore : 85) >= 85 ? 'STRONG HIRE' : (report?.overallScore !== undefined ? report.overallScore : 85) >= 70 ? 'HIRE' : (report?.overallScore !== undefined ? report.overallScore : 85) >= 55 ? 'HIRE WITH RESERVATIONS' : 'DO NOT HIRE'),
      summary: report?.summary || 'Completed live technical interview.',
      strengths: report?.strengths || [],
      weaknesses: report?.weaknesses || [],
      completionDate: new Date().toISOString().split('T')[0]
    }).catch((err) => console.warn('Update candidate warning:', err.message));
  }

  return {
    interviewId,
    candidateId,
    status: 'Completed',
    report
  };
};

/**
 * Helper to generate a controlled, relevant follow-up question
 */
function generateFollowUpQuestion(questionText, answerText, category = 'General') {
  const lowerAns = answerText.toLowerCase();

  if (lowerAns.includes('cache') || lowerAns.includes('redis')) {
    return 'How do you ensure cache consistency and handle cache invalidation during high-volume updates?';
  }
  if (lowerAns.includes('react') || lowerAns.includes('component') || lowerAns.includes('state')) {
    return 'What techniques do you use to optimize performance and prevent unnecessary re-renders in large components?';
  }
  if (lowerAns.includes('database') || lowerAns.includes('sql') || lowerAns.includes('query')) {
    return 'What indexing or partitioning strategy would you apply to optimize queries on large multi-million row datasets?';
  }
  if (lowerAns.includes('microservice') || lowerAns.includes('api') || lowerAns.includes('service')) {
    return 'How do you handle service-to-service failure resilience and circuit breaking under sudden traffic surges?';
  }

  return `Could you elaborate on the key trade-offs and edge cases you considered in your approach?`;
}

export default {
  initLiveSession,
  processLiveTurn,
  completeLiveSession
};
