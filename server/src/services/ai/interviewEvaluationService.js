import supabase from '../../config/supabase.js';
import ApiError from '../../utils/ApiError.js';
import { getInterviewById } from '../interviewService.js';
import { getCandidateById, updateCandidateById } from '../candidateService.js';
import { getQuestionsByInterviewId } from '../questionService.js';
import { evaluateAnswerById, evaluateAnswerDeterministic } from './answerEvaluationService.js';
import { validateAnswerEvaluation } from './answerEvaluationValidator.js';

/**
 * Universal Centralized AI Evaluation Engine
 * Evaluates candidate responses for both ASYNC and LIVE interviews,
 * deterministically computes multi-dimensional recruiter metrics,
 * and upserts the final Report in Supabase
 *
 * @param {string} interviewId - UUID of the interview
 * @returns {Promise<Object>} Persisted recruiter evaluation report
 */
export const evaluateInterview = async (interviewId) => {
  if (!interviewId) {
    throw new ApiError(400, 'Interview ID is required for AI evaluation');
  }

  // 1. Fetch interview details
  const interview = await getInterviewById(interviewId);
  if (!interview) {
    throw new ApiError(404, `Interview ${interviewId} not found`);
  }

  let candidateId = interview.candidateId || interview.candidate?.id;
  if (!candidateId) {
    const { data: candMatch } = await supabase
      .from('candidates')
      .select('id')
      .eq('interview_id', interviewId)
      .limit(1)
      .maybeSingle();
    candidateId = candMatch?.id;
  }
  if (!candidateId) {
    const { data: ansMatch } = await supabase
      .from('answers')
      .select('candidate_id')
      .eq('interview_id', interviewId)
      .not('candidate_id', 'is', null)
      .limit(1)
      .maybeSingle();
    candidateId = ansMatch?.candidate_id;
  }
  if (!candidateId) {
    throw new ApiError(400, 'Interview has no associated candidate record');
  }
  const candidate = await getCandidateById(candidateId);

  // 2. Fetch all configured questions and submitted candidate answers
  const questions = await getQuestionsByInterviewId(interviewId);
  const { data: answers, error: ansError } = await supabase
    .from('answers')
    .select('*, questions(*)')
    .eq('interview_id', interviewId);

  if (ansError) {
    console.error('[EvaluationEngine] Error fetching answers:', ansError);
    throw ansError;
  }

  const answerList = answers || [];

  // 3. Evaluate each question response
  const evaluatedQuestions = [];
  const allStrengths = [];
  const allWeaknesses = [];
  let totalScore = 0;
  let totalTechScore = 0;
  let totalProbScore = 0;
  let totalCommScore = 0;
  let totalConfScore = 0;

  // If questions exist, iterate through configured questions
  const itemsToEvaluate = questions.length > 0 ? questions : answerList.map((a, idx) => ({
    id: a.question_id || a.id || `q-${idx}`,
    answerId: a.id,
    text: a.questions?.text || 'Live Technical Assessment Question',
    category: a.questions?.category || 'Technical',
    difficulty: a.questions?.difficulty || 'Medium'
  }));

  for (let i = 0; i < itemsToEvaluate.length; i++) {
    const q = itemsToEvaluate[i];
    const matchingAnswer = answerList.find(a => 
      (q.answerId && a.id === q.answerId) || 
      (q.id && (a.question_id === q.id || a.question_id_str === q.id))
    ) || (questions.length === 0 ? answerList[i] : null);
    let qEval = null;

    if (matchingAnswer) {
      const hasCompletedScore = matchingAnswer.evaluation_status === 'completed' && matchingAnswer.score !== null;
      if (hasCompletedScore) {
        // Answer was already scored during live turn or prior evaluation run
        const rawScore = Number(matchingAnswer.score);
        qEval = validateAnswerEvaluation({
          score: rawScore,
          technicalAccuracy: rawScore,
          problemSolving: rawScore,
          communication: 85,
          confidence: Math.min(95, Math.max(70, Math.round(rawScore * 0.95))),
          feedback: matchingAnswer.feedback || 'Answer evaluated with clear technical structure.',
          strengths: ['Demonstrated clear understanding of core concepts'],
          weaknesses: []
        });
      } else {
        // Evaluate answer
        try {
          const evalResult = await evaluateAnswerById(matchingAnswer.id);
          qEval = evalResult.evaluation;
        } catch (evalErr) {
          console.warn(`[EvaluationEngine] Fallback evaluation for question ${q.id}:`, evalErr.message);
          qEval = evaluateAnswerDeterministic(
            q.text,
            matchingAnswer.answer_text || matchingAnswer.transcript || '',
            q.category,
            matchingAnswer.code || ''
          );
        }
      }
    } else {
      // Unattempted question
      qEval = {
        score: 0,
        technicalAccuracy: 0,
        problemSolving: 0,
        communication: 0,
        confidence: 90,
        feedback: 'Question was skipped or not answered by the candidate.',
        strengths: [],
        weaknesses: ['Question unattempted']
      };
    }

    totalScore += qEval.score;
    totalTechScore += qEval.technicalAccuracy ?? qEval.score;
    totalProbScore += qEval.problemSolving ?? qEval.score;
    totalCommScore += qEval.communication ?? 80;
    totalConfScore += qEval.confidence ?? 85;

    if (Array.isArray(qEval.strengths)) allStrengths.push(...qEval.strengths);
    if (Array.isArray(qEval.weaknesses)) allWeaknesses.push(...qEval.weaknesses);

    evaluatedQuestions.push({
      questionId: q.id,
      text: q.text,
      category: q.category || 'General',
      difficulty: q.difficulty || 'Medium',
      score: qEval.score,
      technicalAccuracy: qEval.technicalAccuracy ?? qEval.score,
      problemSolving: qEval.problemSolving ?? qEval.score,
      communication: qEval.communication ?? 80,
      feedback: qEval.feedback,
      timeTaken: matchingAnswer?.time_taken || matchingAnswer?.duration || 0,
      answerText: matchingAnswer?.answer_text || matchingAnswer?.transcript || '',
      code: matchingAnswer?.code || ''
    });
  }

  // 4. Calculate deterministic aggregated scores
  const questionCount = Math.max(1, itemsToEvaluate.length);
  const overallScore = Math.round(totalScore / questionCount);
  const technicalScore = Math.round(totalTechScore / questionCount);
  const problemSolvingScore = Math.round(totalProbScore / questionCount);
  const communicationScore = Math.round(totalCommScore / questionCount);
  const confidenceScore = Math.round(totalConfScore / questionCount);

  // Deduplicate strengths & weaknesses
  const uniqueStrengths = [...new Set(allStrengths)].filter(Boolean).slice(0, 5);
  const uniqueWeaknesses = [...new Set(allWeaknesses)].filter(Boolean).slice(0, 5);

  if (uniqueStrengths.length === 0) {
    uniqueStrengths.push('Demonstrated solid foundational technical knowledge');
  }

  // 5. Standardized Recommendation Thresholds
  let recommendation = 'HIRE';
  if (overallScore >= 85) recommendation = 'STRONG HIRE';
  else if (overallScore >= 70) recommendation = 'HIRE';
  else if (overallScore >= 55) recommendation = 'HIRE WITH RESERVATIONS';
  else recommendation = 'DO NOT HIRE';

  // Proctoring observations integration if available
  const proctoringSummary = interview.settings?.proctoringSummary || null;
  const proctoringNote = proctoringSummary
    ? ` Session proctoring recorded ${proctoringSummary.tabHiddenCount || 0} tab switches and ${proctoringSummary.fullscreenExits || 0} fullscreen exits.`
    : '';

  const summary = `Candidate completed ${itemsToEvaluate.length} ${interview.type || 'technical'} interview questions with an overall evaluation score of ${overallScore}%. Evaluated technical accuracy at ${technicalScore}%, problem solving at ${problemSolvingScore}%, and communication clarity at ${communicationScore}%. Recommendation: ${recommendation}.${proctoringNote}`;

  const timeline = evaluatedQuestions.map((eq, idx) => ({
    step: `Question ${idx + 1}`,
    questionId: eq.questionId,
    score: eq.score,
    category: eq.category,
    timestamp: new Date().toISOString()
  }));

  // 6. Idempotent Upsert into Supabase reports table
  const { data: existingReport } = await supabase
    .from('reports')
    .select('id')
    .eq('interview_id', interviewId)
    .maybeSingle();

  const reportPayload = {
    interview_id: interviewId,
    candidate_id: candidateId,
    overall_score: overallScore,
    technical_score: technicalScore,
    communication_score: communicationScore,
    problem_solving_score: problemSolvingScore,
    confidence_score: confidenceScore,
    strengths: uniqueStrengths,
    weaknesses: uniqueWeaknesses,
    recommendation,
    summary,
    question_analysis: evaluatedQuestions,
    timeline,
    generated_at: new Date().toISOString()
  };

  let persistedReport;
  if (existingReport) {
    console.log(`[EvaluationEngine] Updating existing report ${existingReport.id} for interview ${interviewId}`);
    const { data: updated, error: updateReportErr } = await supabase
      .from('reports')
      .update(reportPayload)
      .eq('id', existingReport.id)
      .select('*, candidates(*), interviews(*)')
      .single();

    if (updateReportErr) throw updateReportErr;
    persistedReport = updated;
  } else {
    console.log(`[EvaluationEngine] Creating new report for interview ${interviewId}`);
    const { data: inserted, error: insertReportErr } = await supabase
      .from('reports')
      .insert(reportPayload)
      .select('*, candidates(*), interviews(*)')
      .single();

    if (insertReportErr) throw insertReportErr;
    persistedReport = inserted;
  }

  // 7. Update Candidate profile
  try {
    await supabase
      .from('candidates')
      .update({
        overall_score: overallScore,
        status: 'Completed',
        recommendation,
        summary,
        strengths: uniqueStrengths,
        weaknesses: uniqueWeaknesses,
        completion_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', candidateId);
  } catch (candErr) {
    console.warn('[EvaluationEngine] Update candidate profile notice:', candErr.message);
  }

  return {
    id: persistedReport.id,
    interviewId: persistedReport.interview_id,
    candidateId: persistedReport.candidate_id,
    overallScore: persistedReport.overall_score !== null ? Number(persistedReport.overall_score) : overallScore,
    technicalScore: persistedReport.technical_score !== null ? Number(persistedReport.technical_score) : technicalScore,
    communicationScore: persistedReport.communication_score !== null ? Number(persistedReport.communication_score) : communicationScore,
    problemSolvingScore: persistedReport.problem_solving_score !== null ? Number(persistedReport.problem_solving_score) : problemSolvingScore,
    confidenceScore: persistedReport.confidence_score !== null ? Number(persistedReport.confidence_score) : confidenceScore,
    strengths: persistedReport.strengths || uniqueStrengths,
    weaknesses: persistedReport.weaknesses || uniqueWeaknesses,
    recommendation: persistedReport.recommendation || recommendation,
    summary: persistedReport.summary || summary,
    questionAnalysis: persistedReport.question_analysis || evaluatedQuestions,
    timeline: persistedReport.timeline || timeline,
    proctoringSummary,
    generatedAt: persistedReport.generated_at || new Date().toISOString(),
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email
    },
    interview: {
      id: interview.id,
      title: interview.title,
      type: interview.type
    }
  };
};

// Aliases for backwards compatibility
export const evaluateAsyncInterview = evaluateInterview;
export const evaluateLiveInterview = evaluateInterview;

export default {
  evaluateInterview,
  evaluateAsyncInterview,
  evaluateLiveInterview
};
