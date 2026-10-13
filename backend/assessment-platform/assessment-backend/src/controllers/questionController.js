const asyncHandler = require('express-async-handler');
const Question = require('../models/Question');
const { exportToXlsxBuffer, exportToCsvBuffer, looksLikeCorruptedVersion } = require('../services/bulkImportService');

// Shared by createQuestion/updateQuestion — catches a manually-typed or pasted-from-a-
// spreadsheet version string that's actually a corrupted date serial (see
// looksLikeCorruptedVersion's comment in bulkImportService.js) before it's saved,
// rather than letting a candidate hit "runtime is unknown" mid-exam.
function assertValidStarterCodeVersions(body) {
  (body.starterCode || []).forEach(({ language, version }) => {
    if (looksLikeCorruptedVersion(version)) {
      const err = new Error(
        `The version "${version}" for ${language || 'this language'} looks like a spreadsheet date/number, not a real version — this usually happens when a version like "3.12" gets pasted from Excel/Sheets and silently auto-converted into a date. Please re-enter it (or use "latest").`
      );
      err.status = 400;
      throw err;
    }
  });
}

// POST /api/questions
const createQuestion = asyncHandler(async (req, res) => {
  assertValidStarterCodeVersions(req.body);
  const question = await Question.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(question);
});

// GET /api/questions
const listQuestions = asyncHandler(async (req, res) => {
  const { type, tag, group, difficulty, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (tag) filter.tags = tag;
  if (group) filter.group = group;
  if (difficulty) filter.difficulty = difficulty;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Question.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

// GET /api/questions/groups  — distinct, non-empty group labels with counts, for the
// exam editor's "Add all questions in a group" picker.
const listGroups = asyncHandler(async (req, res) => {
  const groups = await Question.aggregate([
    { $match: { group: { $nin: [null, ''] } } },
    { $group: { _id: '$group', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(groups.map((g) => ({ group: g._id, count: g.count })));
});

// GET /api/questions/:id  (admin — full data including hidden test cases/answers)
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found.');
  }
  res.json(question);
});

// PUT /api/questions/:id
const updateQuestion = asyncHandler(async (req, res) => {
  assertValidStarterCodeVersions(req.body);
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!question) {
    res.status(404);
    throw new Error('Question not found.');
  }
  res.json(question);
});

// DELETE /api/questions/:id
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found.');
  }
  res.status(204).send();
});

// GET /api/questions/export?format=xlsx|csv&ids=<comma-separated>&type=&tag=&difficulty=&search=
// Mirrors bulk-import's column shape so an exported file can be re-imported unchanged.
// If `ids` is omitted, exports the full filtered question bank (same filters as listQuestions).
const exportQuestions = asyncHandler(async (req, res) => {
  const { format = 'xlsx', ids, type, tag, difficulty, search } = req.query;

  const filter = {};
  if (ids) {
    filter._id = { $in: String(ids).split(',').filter(Boolean) };
  } else {
    if (type) filter.type = type;
    if (tag) filter.tags = tag;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.title = { $regex: search, $options: 'i' };
  }

  const questions = await Question.find(filter).sort({ createdAt: -1 });

  if (format === 'csv') {
    const buffer = exportToCsvBuffer(questions);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="question-bank-export.csv"');
    return res.send(buffer);
  }

  const buffer = exportToXlsxBuffer(questions);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="question-bank-export.xlsx"');
  res.send(buffer);
});

// POST /api/questions/media  (multipart: file)
// Uploads one image/video to attach to a question's statement. Returns the public
// (static-served) URL — the client then pushes { kind, url } onto the question's
// `media` array itself via the normal create/update payload.
const uploadQuestionMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Attach it as "file".');
  }
  const kind = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  res.status(201).json({ url: `/uploads/media/${req.file.filename}`, kind });
});

module.exports = {
  createQuestion,
  listQuestions,
  listGroups,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  exportQuestions,
  uploadQuestionMedia,
};