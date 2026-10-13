const router = require('express').Router();
const {
  initInterviewSession,
  evaluateInterview,
  getEvaluationsByAssignment,
  getEvaluationById,
} = require('../controllers/interviewController');
const { requireAdmin } = require('../middleware/auth');
const { requireCandidateToken } = require('../middleware/candidateAuth');

// Candidate routes
router.post('/session/init', requireCandidateToken, initInterviewSession);
router.post('/evaluate', evaluateInterview);

// Admin-protected interview management routes
router.get('/assignment/:assignmentId', requireAdmin, getEvaluationsByAssignment);
router.get('/evaluation/:id', requireAdmin, getEvaluationById);

module.exports = router;
