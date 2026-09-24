import ApiError from '../utils/ApiError.js';
import supabase from '../config/supabase.js';

/**
 * Authentication and identity context resolver
 * Reads token and client-authenticated headers, resolving authoritative user context.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const userRole = req.headers['x-user-role'] || '';
    const userEmail = (req.headers['x-user-email'] || '').trim().toLowerCase();
    const candidateIdHeader = req.headers['x-candidate-id'] || req.query.candidateId || null;

    let candidateId = candidateIdHeader;

    // If user claims to be a candidate or has a candidate email, resolve candidate record
    if (userEmail && !candidateId) {
      const { data: cand } = await supabase
        .from('candidates')
        .select('id, email, role')
        .eq('email', userEmail)
        .maybeSingle();

      if (cand) {
        candidateId = cand.id;
      }
    }

    const isCandidate = userRole.toLowerCase() === 'candidate' || (candidateId && !userRole.toLowerCase().includes('recruiter'));

    req.user = {
      token: authHeader.replace(/^Bearer\s+/i, ''),
      role: isCandidate ? 'Candidate' : (userRole || 'Recruiter Admin'),
      email: userEmail,
      candidateId: candidateId || null,
      id: req.headers['x-user-id'] || candidateId || 'usr_anonymous'
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures user has Recruiter authorization
 */
export const requireRecruiter = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const role = (req.user.role || '').toLowerCase();
  if (role === 'candidate') {
    return next(new ApiError(403, 'Access denied: Recruiter privileges required'));
  }

  next();
};

/**
 * Enforces candidate scoping: candidate can only access resources belonging to their candidateId
 */
export const enforceCandidateScope = (resourceCandidateIdParam = 'candidateId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    // Recruiters have full access
    if (req.user.role !== 'Candidate') {
      return next();
    }

    const targetCandidateId = req.params[resourceCandidateIdParam] || req.query[resourceCandidateIdParam] || req.body[resourceCandidateIdParam];
    if (targetCandidateId && req.user.candidateId && targetCandidateId !== req.user.candidateId) {
      return next(new ApiError(403, 'Access denied: You are not authorized to access this candidate profile or assessment'));
    }

    next();
  };
};

export default {
  authenticate,
  requireRecruiter,
  enforceCandidateScope
};
