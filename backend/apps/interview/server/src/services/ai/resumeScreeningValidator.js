import ApiError from '../../utils/ApiError.js';

const VALID_RECOMMENDATIONS = ['STRONG HIRE', 'HIRE', 'HIRE WITH RESERVATIONS', 'DO NOT HIRE'];

/**
 * Validates and sanitizes structured resume screening output
 * @param {Object} data - Raw model output object
 * @returns {Object} Validated and typed screening result
 */
export const validateScreeningResult = (data) => {
  if (!data || typeof data !== 'object') {
    throw new ApiError(502, 'AI provider returned invalid non-object payload');
  }

  // Validate and clamp scores between 0 and 100
  const parseScore = (val, fallback = 75) => {
    const num = Number(val);
    if (isNaN(num)) return fallback;
    return Math.min(100, Math.max(0, Math.round(num)));
  };

  const overallScore = parseScore(data.overallScore);
  const skillsMatch = parseScore(data.skillsMatch ?? data.skillsScore, overallScore);
  const experienceMatch = parseScore(data.experienceMatch ?? data.experienceScore, overallScore);
  const educationMatch = parseScore(data.educationMatch ?? data.educationScore, overallScore);

  // Validate string arrays
  const parseArray = (arr, fallback = []) => {
    if (!Array.isArray(arr)) return fallback;
    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim().slice(0, 300));
  };

  const matchingSkills = parseArray(data.matchingSkills);
  const missingSkills = parseArray(data.missingSkills);
  const strengths = parseArray(data.strengths, ['Demonstrates solid baseline technical skills']);
  const weaknesses = parseArray(data.weaknesses, []);

  // Validate recommendation
  let recommendation = typeof data.recommendation === 'string' ? data.recommendation.toUpperCase().trim() : 'HIRE';
  if (!VALID_RECOMMENDATIONS.includes(recommendation)) {
    if (overallScore >= 85) recommendation = 'STRONG HIRE';
    else if (overallScore >= 70) recommendation = 'HIRE';
    else if (overallScore >= 55) recommendation = 'HIRE WITH RESERVATIONS';
    else recommendation = 'DO NOT HIRE';
  }

  // Validate summary
  let summary = typeof data.summary === 'string' && data.summary.trim().length > 0
    ? data.summary.trim().slice(0, 1000)
    : `Candidate evaluation complete with overall match score of ${overallScore}%.`;

  return {
    overallScore,
    skillsMatch,
    experienceMatch,
    educationMatch,
    matchingSkills,
    missingSkills,
    strengths,
    weaknesses,
    recommendation,
    summary,
    screenedAt: new Date().toISOString()
  };
};

export default {
  validateScreeningResult
};
