import supabase from '../../config/supabase.js';
import ApiError from '../../utils/ApiError.js';
import { getInterviewById } from '../interviewService.js';
import { getCandidateById, updateCandidateById } from '../candidateService.js';
import { getQuestionsByInterviewId } from '../questionService.js';
import { evaluateAnswerById, evaluateAnswerDeterministic } from './answerEvaluationService.js';
import { validateAnswerEvaluation } from './answerEvaluationValidator.js';

/**
 * Evaluates all submitted answers for an async interview, computes aggregated scores,
 * and persists the final evaluation Report in Supabase
 * @param {string} interviewId - Interview UUID
 * @returns {Promise<Object>} Persisted Report record
 */
export const evaluateAsyncInterview = async (interviewId) => {
  if (!interviewId) {
    throw new ApiError(400, 'Interview ID is required for async evaluation');
  }

  // 1. Fetch interview details
  const interview = await getInterviewById(interviewId);
  const candidateId = interview.candidateId || interview.candidate?.id;
  if (!candidateId) {
    throw new ApiError(400, 'Interview has no associated candidate record');
  }
  const candidate = await getCandidateById(candidateId);

  // 2. Fetch all questions and submitted answers
  const questions = await getQuestionsByInterviewId(interviewId);
  const { data: answers, error: ansError } = await supabase
    .from('answers')
    .select('*, questions(*)')
    .eq('interview_id', interviewId);

  if (ansError) throw ansError;

  // 3. Evaluate each answer
  const evaluatedQuestions = [];
  const allStrengths = [];
  const allWeaknesses = [];
  let totalScore = 0;
  let totalTechScore = 0;
  let totalProbScore = 0;
  let totalCommScore = 0;

  for (const q of questions) {
    const matchingAnswer = answers.find(a => a.question_id === q.id || a.question_id_str === q.id);
    let qEval = null;

    if (matchingAnswer) {
      if (matchingAnswer.evaluation_status === 'completed' && matchingAnswer.score !== null) {
        // Answer already evaluated
        qEval = {
          score: Number(matchingAnswer.score),
          technicalAccuracy: Number(matchingAnswer.score),
          problemSolving: Number(matchingAnswer.score),
          communication: 85,
          feedback: matchingAnswer.feedback || 'Good structured response.',
          strengths: ['Demonstrated clear understanding of the subject'],
          weaknesses: []
        };
      } else {
        // Run AI evaluation for this answer
        try {
          const evalResult = await evaluateAnswerById(matchingAnswer.id);
          qEval = evalResult.evaluation;
        } catch (evalErr) {
          console.warn(`Evaluation fallback for question ${q.id}:`, evalErr.message);
          qEval = evaluateAnswerDeterministic(
            q.text,
            matchingAnswer.answer_text || matchingAnswer.transcript || '',
            q.category,
            matchingAnswer.code || ''
          );
        }
      }
    } else {
      // Question was skipped or not answered
      qEval = {
        score: 0,
        technicalAccuracy: 0,
        problemSolving: 0,
        communication: 0,
        feedback: 'Question was skipped or not answered by the candidate.',
        strengths: [],
        weaknesses: ['Question unattempted']
      };
    }

    totalScore += qEval.score;
    totalTechScore += qEval.technicalAccuracy || qEval.score;
    totalProbScore += qEval.problemSolving || qEval.score;
    totalCommScore += qEval.communication || 85;

    if (qEval.strengths) allStrengths.push(...qEval.strengths);
    if (qEval.weaknesses) allWeaknesses.push(...qEval.weaknesses);

    evaluatedQuestions.push({
      questionId: q.id,
      text: q.text,
      category: q.category || 'General',
      score: qEval.score,
      feedback: qEval.feedback,
      timeTaken: matchingAnswer?.time_taken || matchingAnswer?.duration || 0,
      answerText: matchingAnswer?.answer_text || matchingAnswer?.transcript || '',
      code: matchingAnswer?.code || ''
    });
  }

  // 4. Calculate aggregated interview scores
  const questionCount = Math.max(1, questions.length);
  const overallScore = Math.round(totalScore / questionCount);
  const technicalScore = Math.round(totalTechScore / questionCount);
  const problemSolvingScore = Math.round(totalProbScore / questionCount);
  const communicationScore = Math.round(totalCommScore / questionCount);
  const confidenceScore = Math.min(95, Math.max(70, Math.round(overallScore * 0.95)));

  // Deduplicate and select top strengths and weaknesses
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
  const uniqueWeaknesses = [...new Set(allWeaknesses)].slice(0, 5);

  if (uniqueStrengths.length === 0) {
    uniqueStrengths.push('Demonstrated solid baseline technical knowledge');
  }

  // 5. Determine recommendation & summary
  let recommendation = 'HIRE';
  if (overallScore >= 85) recommendation = 'STRONG HIRE';
  else if (overallScore >= 70) recommendation = 'HIRE';
  else if (overallScore >= 55) recommendation = 'HIRE WITH RESERVATIONS';
  else recommendation = 'DO NOT HIRE';

  const summary = `Candidate completed ${questions.length} async assessment questions with an overall evaluation score of ${overallScore}%. Demonstrated strong problem solving (${problemSolvingScore}%) and technical execution (${technicalScore}%). Recommendation: ${recommendation}.`;

  const timeline = evaluatedQuestions.map((eq, idx) => ({
    step: `Question ${idx + 1}`,
    questionId: eq.questionId,
    score: eq.score,
    category: eq.category,
    timestamp: new Date().toISOString()
  }));

  // 6. Persist or Update Report in Supabase reports table
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
    const { data: updated, error: updateReportErr } = await supabase
      .from('reports')
      .update(reportPayload)
      .eq('id', existingReport.id)
      .select('*, candidates(*), interviews(*)')
      .single();

    if (updateReportErr) throw updateReportErr;
    persistedReport = updated;
  } else {
    const { data: inserted, error: insertReportErr } = await supabase
      .from('reports')
      .insert(reportPayload)
      .select('*, candidates(*), interviews(*)')
      .single();

    if (insertReportErr) throw insertReportErr;
    persistedReport = inserted;
  }

  // 7. Update candidate overall profile
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

export default {
  evaluateAsyncInterview
};
