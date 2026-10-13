/**
 * Intern Auth Routes
 *
 * POST /api/intern/access
 *   Body: { code: "ABCDEF" }
 *   Looks up the exam by 6-char access code.
 *   Auto-provisions or retrieves a Candidate record for this session.
 *   Returns { accessToken, examId } — the accessToken is used as :token in
 *   all /api/exam/:token/* routes.
 *
 * The candidate is created with a generated name ("Candidate-<short-id>") and
 * email ("candidate-<short-id>@exam.local") so the email gate in ExamView
 * can be bypassed. The frontend skips the email gate for access-code-entered exams.
 */
const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const Exam = require('../models/Exam');
const Candidate = require('../models/Candidate');

// POST /api/intern/access — intern enters 6-char code, gets back a candidateAccessToken
router.post('/access', asyncHandler(async (req, res) => {
  const raw = String(req.body.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!raw || raw.length !== 6) {
    res.status(400);
    throw new Error('Please enter the exact 6-character access code from your recruiter.');
  }

  const exam = await Exam.findOne({ accessCode: raw });
  if (!exam) {
    res.status(404);
    throw new Error('No exam found for that access code. Please check the code and try again.');
  }

  if (['closed'].includes(exam.status)) {
    res.status(403);
    throw new Error('This assessment has been closed.');
  }

  // Check exam window
  const now = new Date();
  if (exam.startsAt && now < exam.startsAt) {
    res.status(403);
    throw new Error('This assessment has not started yet.');
  }
  if (exam.endsAt && now > exam.endsAt) {
    res.status(403);
    throw new Error('This assessment window has closed.');
  }

  // Each device gets a unique session — use a per-device fingerprint from IP + user-agent
  // to enable consistent resume. If they already have a candidate record for this exam
  // on this same session, return the same token (resume support).
  // We use a deterministic suffix based on request fingerprint.
  const fingerprint = crypto
    .createHash('sha256')
    .update((req.ip || '') + (req.headers['user-agent'] || '') + exam._id.toString())
    .digest('hex')
    .slice(0, 16);

  const sessionEmail = `session-${fingerprint}@exam.local`;

  // Find existing candidate for this session on this exam
  let candidate = await Candidate.findOne({ exam: exam._id, email: sessionEmail });

  if (candidate) {
    // Block retakes
    if (['submitted', 'auto_submitted', 'blocked', 'terminated', 'banned'].includes(candidate.status)) {
      return res.status(403).json({
        message: 'ACCESS DENIED / BANNED: You have been permanently banned from this assessment due to security violations.',
        status: candidate.status,
      });
    }
    // Resume existing attempt
    return res.json({
      accessToken: candidate.accessToken,
      examId: exam._id,
      candidateId: candidate._id,
      resume: true,
    });
  }

  // Create new candidate
  const accessToken = nanoid(32);
  const shortId = accessToken.slice(0, 8);
  candidate = await Candidate.create({
    name: `Candidate-${shortId}`,
    email: sessionEmail,
    exam: exam._id,
    accessToken,
    status: 'invited',
  });

  res.status(201).json({
    accessToken: candidate.accessToken,
    examId: exam._id,
    candidateId: candidate._id,
    resume: false,
  });
}));

module.exports = router;
