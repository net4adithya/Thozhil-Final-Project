const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { requireCandidateToken, requireCandidateTokenForProctoring } = require('../middleware/candidateAuth');
const { upload } = require('../middleware/uploadRecording');
const { upload: uploadAnswer } = require('../middleware/uploadAnswer');
const {
  verifyEmail,
  getExamForCandidate,
  runCode,
  saveAnswer,
  uploadAnswerFile,
  submitExam,
  logViolation,
  recordingHeartbeat,
} = require('../controllers/candidateExamController');
const { uploadRecording } = require('../controllers/recordingController');
const env = require('../config/env');

// Rate limits are keyed by the candidate's access token (req.params.token), NOT by IP,
// since many candidates may sit behind the same campus/office NAT.
const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.rateLimits.runPerMinute,
  keyGenerator: (req) => req.params.token,
  message: { message: 'Too many "Run Code" requests. Please slow down.' },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.rateLimits.submitPerMinute,
  keyGenerator: (req) => req.params.token,
  message: { message: 'Too many submit attempts. Please wait a moment.' },
});

// Keyed by token (not IP) same as the other candidate-facing limiters, mainly to slow
// down repeated wrong-email guesses against a single link.
const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.rateLimits.verifyEmailPerMinute,
  keyGenerator: (req) => req.params.token,
  message: { message: 'Too many attempts. Please wait a moment and try again.' },
});

router.post('/:token/verify-email', verifyEmailLimiter, requireCandidateToken, verifyEmail);
router.get('/:token', requireCandidateToken, getExamForCandidate);
router.post('/:token/run', runLimiter, requireCandidateToken, runCode);
router.post('/:token/answers', requireCandidateToken, saveAnswer);
router.post('/:token/upload', requireCandidateToken, uploadAnswer.single('file'), uploadAnswerFile);
router.post('/:token/submit', submitLimiter, requireCandidateToken, submitExam);
router.post('/:token/violations', requireCandidateToken, logViolation);
// These two use the "for proctoring" variant deliberately — see its comment in
// candidateAuth.js. They must still work in the brief window after the candidate's
// status has already flipped to submitted/auto_submitted.
router.post('/:token/recordings', requireCandidateTokenForProctoring, upload.single('file'), uploadRecording);
router.post('/:token/recording-heartbeat', requireCandidateTokenForProctoring, recordingHeartbeat);

module.exports = router;
