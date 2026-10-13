const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Exam = require('../models/Exam');
const Candidate = require('../models/Candidate');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const { emitCandidateUpdate } = require('../realtime/socket');
const { invalidateReportCache } = require('../services/reportCache');
const { UPLOAD_ROOT } = require('../middleware/uploadAnswer');
const { reviewCode } = require('../services/geminiReviewService');

/**
 * GET /api/exams/:id/candidates/:candidateId/submission
 * Full submission for one candidate (admin-only).
 */
const getCandidateSubmission = asyncHandler(async (req, res) => {
  const { id: examId, candidateId } = req.params;

  const [exam, candidate, submission] = await Promise.all([
    Exam.findById(examId),
    Candidate.findById(candidateId).select('-accessToken'),
    Submission.findOne({ exam: examId, candidate: candidateId }),
  ]);

  if (!exam) { res.status(404); throw new Error('Exam not found.'); }
  if (!candidate) { res.status(404); throw new Error('Candidate not found.'); }
  if (!submission) {
    return res.json({ candidate, submission: null, answers: [] });
  }

  const questions = await Question.find({ _id: { $in: submission.answers.map((a) => a.question) } });
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  const answers = submission.answers.map((a) => {
    const q = questionMap.get(String(a.question));
    const tcResults = (a.testCaseResults || []).map((tc) => {
      const qTc = q?.testCases?.find((t) => String(t._id) === String(tc.testCaseId));
      return {
        testCaseId: tc.testCaseId,
        isHidden: tc.isHidden,
        passed: tc.passed,
        input: tc.input !== undefined && tc.input !== null ? tc.input : (qTc?.input || ''),
        expectedOutput: tc.expectedOutput !== undefined && tc.expectedOutput !== null ? tc.expectedOutput : (qTc?.expectedOutput || ''),
        actualOutput: tc.actualOutput !== undefined && tc.actualOutput !== null ? tc.actualOutput : (tc.stdout || tc.stderr || (tc.passed ? qTc?.expectedOutput : 'No output')),
        stdout: tc.stdout,
        stderr: tc.stderr,
      };
    });
    return {
      question: q
        ? {
            _id: q._id,
            type: q.type,
            title: q.title,
            statement: q.statement,
            marks: q.marks,
            expectedAnswer: q.expectedAnswer,
            options: q.options,
          }
        : null,
      type: a.type,
      selectedOptionIds: a.selectedOptionIds,
      textAnswer: a.textAnswer,
      code: a.code,
      language: a.language,
      fileUrl: a.fileUrl,
      testCaseResults: tcResults,
      passedCount: a.passedCount,
      totalCount: a.totalCount,
      marksAwarded: a.marksAwarded,
      isCorrect: a.isCorrect,
      feedback: a.feedback,
      gradedAt: a.gradedAt,
      geminiReview: a.geminiReview || null,
      needsManualGrading: ['subjective', 'file_upload'].includes(a.type) && a.isCorrect === null,
    };
  });

  res.json({
    candidate,
    submission: {
      _id: submission._id,
      totalMarksAwarded: submission.totalMarksAwarded,
      totalMarksPossible: submission.totalMarksPossible,
      submittedAt: submission.submittedAt,
      isFinal: submission.isFinal,
      authorityDecision: submission.authorityDecision,
      privateNotes: submission.privateNotes,
      decidedAt: submission.decidedAt,
    },
    answers,
  });
});

// POST /api/exams/:id/candidates/:candidateId/submission/grade
const gradeAnswer = asyncHandler(async (req, res) => {
  const { id: examId, candidateId } = req.params;
  const { questionId, marksAwarded, feedback } = req.body;

  if (questionId === undefined || marksAwarded === undefined) {
    res.status(400);
    throw new Error('questionId and marksAwarded are required.');
  }

  const submission = await Submission.findOne({ exam: examId, candidate: candidateId });
  if (!submission) { res.status(404); throw new Error('No submission found for this candidate.'); }
  if (!submission.isFinal) { res.status(400); throw new Error('This candidate has not submitted the exam yet.'); }

  const answer = submission.answers.find((a) => String(a.question) === String(questionId));
  if (!answer) { res.status(404); throw new Error('This question is not part of the submission.'); }

  const question = await Question.findById(questionId).select('marks type');
  if (!question) { res.status(404); throw new Error('Question not found.'); }

  const clamped = Math.max(0, Math.min(Number(marksAwarded) || 0, question.marks));
  const previousMarks = answer.marksAwarded || 0;

  answer.marksAwarded = clamped;
  answer.isCorrect = clamped >= question.marks;
  answer.feedback = feedback || '';
  answer.gradedAt = new Date();
  answer.gradedBy = req.user._id;

  submission.totalMarksAwarded =
    Math.round((submission.totalMarksAwarded - previousMarks + clamped) * 100) / 100;

  await submission.save();
  await invalidateReportCache(examId);
  emitCandidateUpdate(examId, 'graded', {
    candidateId,
    questionId,
    marksAwarded: clamped,
    totalMarksAwarded: submission.totalMarksAwarded,
  });

  res.json({ graded: true, marksAwarded: clamped, totalMarksAwarded: submission.totalMarksAwarded });
});

/**
 * POST /api/exams/:id/candidates/:candidateId/submission/decision
 * Authority records a decision on a submission (approve/reject/resubmit_requested)
 * and optionally adds private notes.
 * Body: { decision: 'approved'|'rejected'|'resubmit_requested', privateNotes?: string }
 */
const recordDecision = asyncHandler(async (req, res) => {
  const { id: examId, candidateId } = req.params;
  const { decision, privateNotes } = req.body;

  const validDecisions = ['approved', 'rejected', 'resubmit_requested', 'pending'];
  if (!validDecisions.includes(decision)) {
    res.status(400);
    throw new Error(`decision must be one of: ${validDecisions.join(', ')}`);
  }

  const submission = await Submission.findOne({ exam: examId, candidate: candidateId });
  if (!submission) { res.status(404); throw new Error('No submission found for this candidate.'); }

  submission.authorityDecision = decision;
  if (privateNotes !== undefined) submission.privateNotes = String(privateNotes).slice(0, 5000);
  submission.decidedAt = new Date();
  submission.decidedBy = req.user._id;

  await submission.save();

  res.json({
    decision: submission.authorityDecision,
    privateNotes: submission.privateNotes,
    decidedAt: submission.decidedAt,
  });
});

/**
 * POST /api/exams/:id/candidates/:candidateId/submission/gemini-review
 * Triggers Gemini AI review for all coding answers in this submission.
 * Safe to call multiple times — reviews are updated in-place.
 */
const triggerGeminiReview = asyncHandler(async (req, res) => {
  const { id: examId, candidateId } = req.params;

  const submission = await Submission.findOne({ exam: examId, candidate: candidateId });
  if (!submission) { res.status(404); throw new Error('No submission found for this candidate.'); }
  if (!submission.isFinal) { res.status(400); throw new Error('Submission is not finalized yet.'); }

  const codingAnswers = submission.answers.filter((a) => a.type === 'coding' && a.code);
  if (codingAnswers.length === 0) {
    return res.json({ reviewed: 0, message: 'No coding answers to review.' });
  }

  const questionIds = codingAnswers.map((a) => a.question);
  const questions = await Question.find({ _id: { $in: questionIds } }).select('title statement');
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  let reviewed = 0;
  for (const answer of codingAnswers) {
    const q = questionMap.get(String(answer.question));
    if (!q) continue;
    // eslint-disable-next-line no-await-in-loop
    const review = await reviewCode({
      questionTitle: q.title,
      questionStatement: q.statement,
      code: answer.code,
      language: answer.language,
      passedCount: answer.passedCount || 0,
      totalCount: answer.totalCount || 0,
    });
    if (review) {
      answer.geminiReview = review;
      reviewed++;
    }
  }

  await submission.save();
  res.json({ reviewed, total: codingAnswers.length });
});

// GET download answer file (admin)
const downloadAnswerFile = asyncHandler(async (req, res) => {
  const { id: examId, candidateId, questionId } = req.params;

  const submission = await Submission.findOne({ exam: examId, candidate: candidateId });
  if (!submission) { res.status(404); throw new Error('No submission found for this candidate.'); }

  const answer = submission.answers.find((a) => String(a.question) === String(questionId));
  if (!answer || !answer.fileUrl) { res.status(404); throw new Error('No uploaded file for this answer.'); }

  const absolutePath = path.join(UPLOAD_ROOT, answer.fileUrl);
  if (!absolutePath.startsWith(UPLOAD_ROOT) || !fs.existsSync(absolutePath)) {
    res.status(404);
    throw new Error('File is missing on disk.');
  }

  res.download(absolutePath, answer.originalName || path.basename(absolutePath));
});

module.exports = {
  getCandidateSubmission,
  gradeAnswer,
  recordDecision,
  triggerGeminiReview,
  downloadAnswerFile,
};
