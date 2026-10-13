const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { requireAdmin } = require('../middleware/auth');
const QuestionBank = require('../models/QuestionBank');
const Question = require('../models/Question');

// GET /api/question-banks — list all banks with question counts (admin-only)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const banks = await QuestionBank.find().populate('questions', 'title type difficulty marks group').lean();
  res.json(banks);
}));

// GET /api/question-banks/:id — one bank with all its questions (admin-only)
router.get('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const bank = await QuestionBank.findById(req.params.id).populate('questions').lean();
  if (!bank) { res.status(404); throw new Error('Question bank not found.'); }
  res.json(bank);
}));

module.exports = router;
