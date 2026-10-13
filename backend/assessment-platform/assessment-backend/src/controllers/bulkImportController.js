const asyncHandler = require('express-async-handler');
const Question = require('../models/Question');
const { previewImport } = require('../services/bulkImportService');

// POST /api/questions/bulk-import/preview  (multipart: file)
// Parses + validates the sheet and returns row-level results. Nothing is saved yet.
const preview = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Attach a .csv or .xlsx file as "file".');
  }

  const result = await previewImport(req.file.buffer, req.file.originalname);
  res.json(result);
});

// POST /api/questions/bulk-import/confirm  { questions: [<validated Question data>, ...] }
// The client sends back the (subset of) rows it wants committed, typically the ones
// with no errors from the preview step. Server does NOT re-trust row indexes from the
// client — it re-validates shape via the Question schema itself on insert.
const confirm = asyncHandler(async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    res.status(400);
    throw new Error('questions must be a non-empty array of validated question objects.');
  }

  const toInsert = questions.map((q) => ({ ...q, createdBy: req.user._id }));

  const created = [];
  const failed = [];
  for (const q of toInsert) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const doc = await Question.create(q);
      created.push(doc._id);
    } catch (err) {
      failed.push({ title: q.title, error: err.message });
    }
  }

  res.status(201).json({ createdCount: created.length, createdIds: created, failed });
});

module.exports = { preview, confirm };
