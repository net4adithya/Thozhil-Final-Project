const crypto = require('crypto');
const { nanoid } = require('nanoid');
const Candidate = require('../models/Candidate');
const Exam = require('../models/Exam');

/**
 * Candidates never log in with a username/password. Their access token (from the
 * one-time exam link, e.g. /exam/:token) or the 6-character exam access code is the credential.
 * This middleware resolves it and attaches req.candidate + req.exam, and enforces basic exam-window checks.
 */
async function resolveCandidateAndExam(req, token) {
  if (!token) return { candidate: null, exam: null };
  
  let candidate = await Candidate.findOne({ accessToken: token }).populate('exam');
  if (candidate && candidate.exam) {
    return { candidate, exam: candidate.exam };
  }

  // If token is an exam access code (e.g. 6 chars uppercase)
  const code = String(token).trim().toUpperCase();
  const exam = await Exam.findOne({ accessCode: code });
  if (exam) {
    const fingerprint = crypto
      .createHash('sha256')
      .update((req.ip || '') + (req.headers['user-agent'] || '') + exam._id.toString())
      .digest('hex')
      .slice(0, 16);
    const sessionEmail = `session-${fingerprint}@exam.local`;

    candidate = await Candidate.findOne({ exam: exam._id, email: sessionEmail });
    if (!candidate) {
      const accessToken = nanoid(32);
      candidate = await Candidate.create({
        name: `Intern-${fingerprint.slice(0, 6).toUpperCase()}`,
        email: sessionEmail,
        exam: exam._id,
        accessToken,
        status: 'invited',
      });
    }
    candidate.exam = exam;
    return { candidate, exam };
  }

  return { candidate: null, exam: null };
}

async function requireCandidateToken(req, res, next) {
  const token = req.params.token || req.headers['x-candidate-token'];
  if (!token) {
    return res.status(401).json({ message: 'Missing exam access token.' });
  }

  const { candidate, exam } = await resolveCandidateAndExam(req, token);
  if (!candidate || !exam) {
    return res.status(404).json({ message: 'Invalid exam link or access code.' });
  }

  if (['submitted', 'auto_submitted', 'expired'].includes(candidate.status)) {
    return res.status(403).json({ message: 'This exam has already been completed.' });
  }

  const now = new Date();
  if (exam.startsAt && now < exam.startsAt) {
    return res.status(403).json({ message: 'This exam has not started yet.' });
  }
  if (exam.endsAt && now > exam.endsAt) {
    candidate.status = 'expired';
    await candidate.save();
    return res.status(403).json({ message: 'This exam window has closed.' });
  }

  req.candidate = candidate;
  req.exam = exam;
  next();
}

/**
 * Same token resolution as requireCandidateToken, but deliberately WITHOUT the
 * "already completed" (or exam-window) block. Used only for the proctoring routes
 * (recording upload + heartbeat) that must still be able to flush their last few
 * seconds of data in the moments right around submission — whether that's the normal
 * "submit exam" button (server marks the candidate submitted, then the browser stops
 * the recorder and uploads its final segment) or a violation-triggered auto-submit
 * (server marks the candidate auto_submitted immediately, before the client even knows
 * to stop recording). Without this, requireCandidateToken's status check would 403 that
 * final segment and it would silently never reach the admin's recordings list.
 */
async function requireCandidateTokenForProctoring(req, res, next) {
  const token = req.params.token || req.headers['x-candidate-token'];
  if (!token) {
    return res.status(401).json({ message: 'Missing exam access token.' });
  }

  const { candidate, exam } = await resolveCandidateAndExam(req, token);
  if (!candidate || !exam) {
    return res.status(404).json({ message: 'Invalid exam link or access code.' });
  }

  req.candidate = candidate;
  req.exam = exam;
  next();
}

module.exports = { requireCandidateToken, requireCandidateTokenForProctoring };

