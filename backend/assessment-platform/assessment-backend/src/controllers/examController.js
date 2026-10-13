const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const Submission = require('../models/Submission');
const Recording = require('../models/Recording');
const { UPLOAD_ROOT } = require('../middleware/uploadRecording');
const { invalidateReportCache } = require('../services/reportCache');

// Generate a unique 6-char access code [A-Z0-9]
async function generateAccessCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
    const existing = await Exam.findOne({ accessCode: code });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique access code — please try again.');
}

// POST /api/exams
const createExam = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };

  // Auto-generate access code when creating an exam (so it's immediately available)
  if (!data.accessCode) {
    data.accessCode = await generateAccessCode();
  }

  const exam = await Exam.create(data);
  res.status(201).json(exam);
});

// GET /api/exams
const listExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
  res.json(exams);
});

// GET /api/exams/:id
const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('questions');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }
  res.json(exam);
});

// PUT /api/exams/:id
const updateExam = asyncHandler(async (req, res) => {
  const body = { ...req.body };

  // When changing status to active/published, ensure an access code exists
  if (['active', 'published', 'scheduled'].includes(body.status)) {
    const current = await Exam.findById(req.params.id);
    if (current && !current.accessCode) {
      body.accessCode = await generateAccessCode();
    }
  }

  const exam = await Exam.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }
  res.json(exam);
});

// DELETE /api/exams/:id
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }

  const examId = exam._id;

  const recordings = await Recording.find({ exam: examId }).select('_id filePath').lean();
  for (const recording of recordings) {
    try {
      const absolutePath = path.join(UPLOAD_ROOT, recording.filePath);
      if (absolutePath.startsWith(UPLOAD_ROOT) && fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (err) {
      console.error(`[exam-delete] failed to remove recording file for ${recording._id}:`, err.message);
    }
  }

  await Promise.all([
    Recording.deleteMany({ exam: examId }),
    Submission.deleteMany({ exam: examId }),
    Candidate.deleteMany({ exam: examId }),
  ]);

  await exam.deleteOne();
  await invalidateReportCache(examId);

  res.status(204).send();
});

// POST /api/exams/:id/questions  { questionIds: [...] }
const attachQuestions = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }

  const questions = await Question.find({ _id: { $in: questionIds } });
  exam.questions = [...new Set([...exam.questions.map(String), ...questionIds])];
  exam.totalMarks = await computeTotalMarks(exam.questions);
  await exam.save();

  res.json(exam);
});

async function computeTotalMarks(questionIds) {
  const questions = await Question.find({ _id: { $in: questionIds } }).select('marks');
  return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
}

// POST /api/exams/:id/candidates  { candidates: [{ name, email }, ...] }
const inviteCandidates = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }

  const { candidates } = req.body;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    res.status(400);
    throw new Error('candidates must be a non-empty array of { name, email }.');
  }

  const created = [];
  for (const c of candidates) {
    const accessToken = nanoid(32);
    // eslint-disable-next-line no-await-in-loop
    const candidate = await Candidate.findOneAndUpdate(
      { exam: exam._id, email: c.email.toLowerCase() },
      { $setOnInsert: { name: c.name, email: c.email, exam: exam._id, accessToken } },
      { upsert: true, new: true }
    );
    created.push({
      id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      examLink: `/exam/${candidate.accessToken}`,
    });
  }

  res.status(201).json({ candidates: created });
});

// GET /api/exams/:id/candidates
const listCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find({ exam: req.params.id }).select('-accessToken');
  res.json(candidates);
});

module.exports = {
  createExam,
  listExams,
  getExam,
  updateExam,
  deleteExam,
  attachQuestions,
  inviteCandidates,
  listCandidates,
};
