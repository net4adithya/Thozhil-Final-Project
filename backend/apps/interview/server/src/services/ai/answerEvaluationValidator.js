import ApiError from '../../utils/ApiError.js';

/**
 * Validates, bounds, and sanitizes structured AI answer evaluation output
 * @param {Object} data - Raw model evaluation output
 * @returns {Object} Validated and strictly typed evaluation result
 */
export const validateAnswerEvaluation = (data) => {
  if (!data || typeof data !== 'object') {
    throw new ApiError(502, 'AI provider returned invalid non-object evaluation payload');
  }

  const parseScore = (val, fallback = 70) => {
    const num = Number(val);
    if (isNaN(num)) return fallback;
    return Math.min(100, Math.max(0, Math.round(num)));
  };

  const score = parseScore(data.score, 70);
  const technicalAccuracy = parseScore(data.technicalAccuracy ?? data.competencies?.technicalAccuracy, score);
  const relevance = parseScore(data.relevance, score);
  const problemSolving = parseScore(data.problemSolving ?? data.competencies?.problemSolving, score);
  const communication = parseScore(data.communication ?? data.competencies?.communication, 80);
  const completeness = parseScore(data.completeness, technicalAccuracy);
  const confidence = parseScore(data.confidence, Math.min(95, Math.max(70, Math.round(score * 0.95))));

  const parseArray = (arr, fallback = []) => {
    if (!Array.isArray(arr)) return fallback;
    const cleanList = arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim().slice(0, 300));
    return cleanList.length > 0 ? cleanList : fallback;
  };

  const strengths = parseArray(data.strengths, ['Demonstrated clear understanding of core concepts']);
  const weaknesses = parseArray(data.weaknesses, []);

  let feedback = typeof data.feedback === 'string' && data.feedback.trim().length > 0
    ? data.feedback.trim().slice(0, 1000)
    : `Candidate answered with a score of ${score}%.`;

  let reasoning = typeof data.reasoning === 'string' && data.reasoning.trim().length > 0
    ? data.reasoning.trim().slice(0, 1000)
    : `Evaluation scored ${score}% based on technical accuracy, relevance, and response depth.`;

  return {
    score,
    technicalAccuracy,
    relevance,
    problemSolving,
    communication,
    completeness,
    confidence,
    strengths,
    weaknesses,
    feedback,
    reasoning,
    evaluatedAt: new Date().toISOString()
  };
};

export default {
  validateAnswerEvaluation
};
