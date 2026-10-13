const asyncHandler = require('express-async-handler');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const Submission = require('../models/Submission');
const { runAgainstTestCase, scoreCodingAnswer, toCandidateSafeResults } = require('../services/judgeService');
const { emitCandidateUpdate } = require('../realtime/socket');
const { invalidateReportCache } = require('../services/reportCache');

// POST /api/exam/:token/verify-email
// Gate in front of the exam: candidate must type the email the invite was sent to
// before getExamForCandidate will hand over questions. This is NOT a security boundary
// — anyone with both the link and the correct email (which usually travel together in
// the same invite) sails through — it exists to catch the far more common case of the
// link being opened by the wrong person (forwarded mail, shared inbox, someone else's
// browser) before they ever see exam content or the candidate's status flips to
// "started". Doesn't persist anything; getExamForCandidate is still the source of truth
// for starting the attempt.
const verifyEmail = asyncHandler(async (req, res) => {
  const { candidate } = req;
  const submitted = String(req.body.email || '').trim().toLowerCase();

  if (!submitted) {
    res.status(400);
    throw new Error('Enter the email address the invite was sent to.');
  }

  if (submitted !== candidate.email) {
    res.status(403);
    throw new Error('That email does not match the invite for this exam link.');
  }

  res.json({ verified: true });
});

// GET /api/exam/:token
// Returns the exam with candidate-safe questions (no hidden test cases, no answer keys).
const getExamForCandidate = asyncHandler(async (req, res) => {
  const { exam, candidate } = req;

  if (['submitted', 'auto_submitted', 'banned', 'blocked', 'terminated'].includes(candidate.status)) {
    res.status(403);
    throw new Error('ACCESS DENIED: You have been banned/terminated from this assessment due to security violations. You cannot attempt this exam again.');
  }

  if (candidate.status === 'invited') {
    candidate.status = 'started';
    candidate.startedAt = new Date();
    await candidate.save();
    emitCandidateUpdate(exam._id, 'status', { candidateId: candidate._id, status: candidate.status });
  }

  const questions = await Question.find({ _id: { $in: exam.questions } });
  const safeQuestions = questions.map((q) => q.toCandidateSafeJSON());

  res.json({
    exam: {
      id: exam._id,
      title: exam.title,
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      proctoring: exam.proctoring,
    },
    candidate: {
      id: candidate._id,
      name: candidate.name,
      status: candidate.status,
      startedAt: candidate.startedAt,
    },
    questions: safeQuestions,
  });
});

// POST /api/exam/:token/run
// "Run Code" — executes against VISIBLE test cases only. Never scored, never persisted
// as part of the final grade. Lets candidates sanity-check their code before submitting.
const runCode = asyncHandler(async (req, res) => {
  const { exam } = req;
  const { questionId, code, language, version } = req.body;

  if (!exam.questions.map(String).includes(String(questionId))) {
    res.status(400);
    throw new Error('Question does not belong to this exam.');
  }

  const question = await Question.findById(questionId);
  if (!question || question.type !== 'coding') {
    res.status(400);
    throw new Error('Not a coding question.');
  }

  if (question.allowedLanguages?.length && !question.allowedLanguages.includes(language)) {
    res.status(400);
    throw new Error(`Language "${language}" is not allowed for this question.`);
  }

  const visibleCases = question.testCases.filter((tc) => !tc.isHidden);
  const results = [];
  for (const tc of visibleCases) {
    // eslint-disable-next-line no-await-in-loop
    const r = await runAgainstTestCase({
      language,
      version,
      code,
      testCase: tc,
      customCheckerCode: question.customCheckerCode || null,
    });
    results.push(r);
  }

  res.json({ results: toCandidateSafeResults(results) });
});

// POST /api/exam/:token/answers
// Autosave a single answer (any question type) without finalizing the submission.
const saveAnswer = asyncHandler(async (req, res) => {
  const { exam, candidate } = req;
  const { questionId, ...payload } = req.body;

  if (!exam.questions.map(String).includes(String(questionId))) {
    res.status(400);
    throw new Error('Question does not belong to this exam.');
  }

  const question = await Question.findById(questionId);
  if (!question) {
    res.status(404);
    throw new Error('Question not found.');
  }

  let submission = await Submission.findOne({ exam: exam._id, candidate: candidate._id });
  if (!submission) {
    submission = await Submission.create({ exam: exam._id, candidate: candidate._id, answers: [] });
  }
  if (submission.isFinal) {
    res.status(403);
    throw new Error('This exam has already been submitted.');
  }

  const answerData = buildDraftAnswer(question, payload);
  const idx = submission.answers.findIndex((a) => String(a.question) === String(questionId));
  if (idx >= 0) submission.answers[idx] = { ...submission.answers[idx].toObject(), ...answerData };
  else submission.answers.push(answerData);

  const statusChanged = candidate.status === 'started';
  if (statusChanged) candidate.status = 'in_progress';
  await Promise.all([submission.save(), candidate.save()]);

  const answeredCount = submission.answers.filter((a) => hasContent(a)).length;
  emitCandidateUpdate(exam._id, 'progress', {
    candidateId: candidate._id,
    status: candidate.status,
    answeredCount,
    totalQuestions: exam.questions.length,
  });
  await invalidateReportCache(exam._id);

  res.json({ saved: true });
});

function hasContent(answer) {
  return (
    (answer.selectedOptionIds && answer.selectedOptionIds.length > 0) ||
    (answer.textAnswer && answer.textAnswer.trim().length > 0) ||
    (answer.code && answer.code.trim().length > 0) ||
    !!answer.fileUrl
  );
}

// POST /api/exam/:token/upload  (multipart: file, questionId)
// Handles the actual file for a `file_upload` question — previously the schema had a
// `fileUrl` field but nothing ever populated it. The file is written to disk by the
// uploadAnswer multer middleware before this handler runs; here we just record a
// reference to it on the (draft) submission, same as any other autosaved answer.
const uploadAnswerFile = asyncHandler(async (req, res) => {
  const { exam, candidate } = req;
  const { questionId } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Attach it as "file".');
  }
  if (!exam.questions.map(String).includes(String(questionId))) {
    res.status(400);
    throw new Error('Question does not belong to this exam.');
  }

  const question = await Question.findById(questionId);
  if (!question || question.type !== 'file_upload') {
    res.status(400);
    throw new Error('Not a file-upload question.');
  }

  let submission = await Submission.findOne({ exam: exam._id, candidate: candidate._id });
  if (!submission) {
    submission = await Submission.create({ exam: exam._id, candidate: candidate._id, answers: [] });
  }
  if (submission.isFinal) {
    res.status(403);
    throw new Error('This exam has already been submitted.');
  }

  // Stored as a stable "candidateId/filename" reference rather than a public URL — the
  // actual bytes are only reachable through the authenticated admin download route.
  const fileUrl = `${candidate._id}/${req.file.filename}`;

  const answerData = { question: question._id, type: 'file_upload', fileUrl, originalName: req.file.originalname };
  const idx = submission.answers.findIndex((a) => String(a.question) === String(questionId));
  if (idx >= 0) submission.answers[idx] = { ...submission.answers[idx].toObject(), ...answerData };
  else submission.answers.push(answerData);

  if (candidate.status === 'started') candidate.status = 'in_progress';
  await Promise.all([submission.save(), candidate.save()]);

  res.json({ uploaded: true, fileUrl, originalName: req.file.originalname });
});

function buildDraftAnswer(question, payload) {
  const base = { question: question._id, type: question.type };
  switch (question.type) {
    case 'mcq':
    case 'multi_select':
    case 'true_false':
      return { ...base, selectedOptionIds: payload.selectedOptionIds || [] };
    case 'fill_blank':
    case 'subjective':
      return { ...base, textAnswer: payload.textAnswer || '' };
    case 'coding':
      return { ...base, code: payload.code || '', language: payload.language || '' };
    case 'file_upload':
      return { ...base, fileUrl: payload.fileUrl || '' };
    default:
      return base;
  }
}

// Shared by the explicit "Submit exam" button and by violation-triggered auto-submit,
// so both paths grade identically and can't diverge.
async function finalizeSubmission({ exam, candidate, statusOnFinish }) {
  let submission = await Submission.findOne({ exam: exam._id, candidate: candidate._id });
  if (!submission) {
    submission = await Submission.create({
      exam: exam._id,
      candidate: candidate._id,
      answers: [],
      totalMarksAwarded: 0,
      totalMarksPossible: 0,
    });
  }
  if (submission.isFinal) {
    return submission; // already graded (e.g. violation auto-submit racing the submit button)
  }

  const questions = await Question.find({ _id: { $in: exam.questions } });
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  let totalAwarded = 0;
  let totalPossible = 0;

  for (const answer of submission.answers) {
    const question = questionMap.get(String(answer.question));
    if (!question) continue;
    totalPossible += question.marks;

    if (question.type === 'coding' && answer.code) {
      // eslint-disable-next-line no-await-in-loop
      const result = await scoreCodingAnswer({
        language: answer.language,
        version: resolveVersion(question, answer.language),
        code: answer.code,
        question,
      });
      answer.testCaseResults = result.testCaseResults;
      answer.passedCount = result.passedCount;
      answer.totalCount = result.totalCount;
      answer.marksAwarded = result.marksAwarded;
      answer.isCorrect = result.isCorrect;
      answer.gradedAt = new Date();
      totalAwarded += result.marksAwarded;
    } else if (['mcq', 'multi_select', 'true_false'].includes(question.type)) {
      const graded = gradeObjective(question, answer);
      answer.marksAwarded = graded.marksAwarded;
      answer.isCorrect = graded.isCorrect;
      answer.gradedAt = new Date();
      totalAwarded += graded.marksAwarded;
    }
    // subjective / file_upload: left ungraded (marksAwarded stays 0) for manual review
  }

  submission.totalMarksAwarded = Math.round(totalAwarded * 100) / 100;
  submission.totalMarksPossible = totalPossible;
  submission.submittedAt = new Date();
  submission.isFinal = true;

  candidate.status = statusOnFinish;
  candidate.submittedAt = new Date();

  await Promise.all([submission.save(), candidate.save()]);
  await invalidateReportCache(exam._id);
  emitCandidateUpdate(exam._id, 'submitted', {
    candidateId: candidate._id,
    status: candidate.status,
    totalMarksAwarded: submission.totalMarksAwarded,
    totalMarksPossible: submission.totalMarksPossible,
  });
  return submission;
}

// POST /api/exam/:token/submit
const submitExam = asyncHandler(async (req, res) => {
  const { exam, candidate } = req;

  if (candidate.status === 'submitted' || candidate.status === 'auto_submitted') {
    res.status(403);
    throw new Error('This exam has already been submitted.');
  }

  const submission = await finalizeSubmission({ exam, candidate, statusOnFinish: 'submitted' });

  res.json({
    submitted: true,
    totalMarksAwarded: submission.totalMarksAwarded,
    totalMarksPossible: submission.totalMarksPossible,
  });
});

function resolveVersion(question, language) {
  const entry = question.starterCode.find((s) => s.language === language);
  return entry?.version || 'latest';
}

function gradeObjective(question, answer) {
  const correctIds = question.options
    .filter((o) => o.isCorrect)
    .map((o) => String(o._id))
    .sort();
  const selectedIds = (answer.selectedOptionIds || []).map(String).sort();

  const isCorrect =
    correctIds.length === selectedIds.length && correctIds.every((id, i) => id === selectedIds[i]);

  let marksAwarded = isCorrect ? question.marks : 0;
  if (!isCorrect && question.negativeMarks > 0 && selectedIds.length > 0) {
    marksAwarded = -question.negativeMarks;
  }
  return { isCorrect, marksAwarded };
}

// POST /api/exam/:token/violations
// Logs a proctoring violation (fullscreen exit, tab switch, screen-share stopped, etc).
// If the exam's configured threshold is reached, auto-submits and grades immediately —
// the same finalizeSubmission() path the "Submit exam" button uses, so behavior is identical.
const logViolation = asyncHandler(async (req, res) => {
  const { exam, candidate } = req;
  const { type, meta } = req.body;

  const allowedTypes = [
    'fullscreen_exit',
    'tab_hidden',
    'window_blur',
    'screen_share_stopped',
    'webcam_denied',
    'copy_paste',
    'devtools',
    'restricted_shortcut',
    'game_bar_shortcut',
  ];
  if (!allowedTypes.includes(type)) {
    res.status(400);
    throw new Error(`Invalid violation type. Must be one of: ${allowedTypes.join(', ')}`);
  }

  if (['submitted', 'auto_submitted', 'banned', 'blocked', 'terminated'].includes(candidate.status)) {
    return res.json({ logged: false, autoSubmitted: false, banned: true, reason: 'already_submitted_or_banned' });
  }

  candidate.violations.push({ type, meta });
  candidate.violationCount += 1;
  await candidate.save();

  const threshold = exam.proctoring?.maxViolations ?? 3;
  // Instantly ban and terminate exam on any forbidden shortcut, tab switch, copy/paste, devtools, or fullscreen exit
  const isImmediateTermination = true; 
  const shouldAutoSubmit = true;

  candidate.status = 'banned';
  await candidate.save();

  emitCandidateUpdate(exam._id, 'violation', {
    candidateId: candidate._id,
    type,
    violationCount: candidate.violationCount,
    threshold,
    immediateTermination: true,
    banned: true,
  });
  await invalidateReportCache(exam._id);

  await finalizeSubmission({ exam, candidate, statusOnFinish: 'banned' });

  res.json({
    logged: true,
    violationCount: candidate.violationCount,
    threshold,
    autoSubmitted: true,
    terminated: true,
    banned: true,
    reason: type,
  });
});

// POST /api/exam/:token/recording-heartbeat  { webcamActive, screenActive }
// Candidate app calls this every ~10s while its MediaRecorder(s) are actually in the
// "recording" state (see useProctoring.js). This is the only signal that distinguishes
// "webcam is live right now" from "we received an uploaded segment a while ago" — the
// admin dashboard treats a heartbeat older than a short threshold as stalled/stopped.
const recordingHeartbeat = asyncHandler(async (req, res) => {
  const { exam, candidate } = req;
  const webcamActive = !!req.body.webcamActive;
  const screenActive = !!req.body.screenActive;

  candidate.recording = { webcamActive, screenActive, lastHeartbeatAt: new Date() };
  await candidate.save();

  emitCandidateUpdate(exam._id, 'recording', {
    candidateId: candidate._id,
    webcamActive,
    screenActive,
    lastHeartbeatAt: candidate.recording.lastHeartbeatAt.toISOString(),
  });

  res.json({ ok: true });
});

module.exports = {
  verifyEmail,
  getExamForCandidate,
  runCode,
  saveAnswer,
  uploadAnswerFile,
  submitExam,
  logViolation,
  recordingHeartbeat,
  finalizeSubmission,
};
