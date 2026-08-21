import ApiError from '../../utils/ApiError.js';

/**
 * Validates and sanitizes structured AI answer evaluation output
 * @param {Object} data - Raw model evaluation output
 * @returns {Object} Validated and typed evaluation result
 */
export const validateAnswerEvaluation = (data) => {
  if (!data || typeof data !== 'object') {
    throw new ApiError(502, 'AI provider returned invalid non-object evaluation payload');
  }

  const parseScore = (val, fallback = 75) => {
    const num = Number(val);
    if (isNaN(num)) return fallback;
    return Math.min(100, Math.max(0, Math.round(num)));
  };

  const score = parseScore(data.score);
  const technicalAccuracy = parseScore(data.technicalAccuracy, score);
  const relevance = parseScore(data.relevance, score);
  const problemSolving = parseScore(data.problemSolving, score);
  const communication = parseScore(data.communication, score);
  const completeness = parseScore(data.completeness, score);

  const parseArray = (arr, fallback = []) => {
    if (!Array.isArray(arr)) return fallback;
    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim().slice(0, 300));
  };

  const strengths = parseArray(data.strengths, ['Clear and structured explanation']);
  const weaknesses = parseArray(data.weaknesses, []);

  let feedback = typeof data.feedback === 'string' && data.feedback.trim().length > 0
    ? data.feedback.trim().slice(0, 1000)
    : `Candidate answered with a score of ${score}%.`;

  let reasoning = typeof data.reasoning === 'string' && data.reasoning.trim().length > 0
    ? data.reasoning.trim().slice(0, 1000)
    : 'Evaluation based on technical accuracy, relevance, and clarity.';

  return {
    score,
    technicalAccuracy,
    relevance,
    problemSolving,
    communication,
    completeness,
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
