const asyncHandler = require('express-async-handler');
const Exam = require('../models/Exam');
const { buildReportRows, buildQuestionAnalysis, buildXlsxReport, buildPdfReport } = require('../services/reportService');
const reportCache = require('../services/reportCache');

// GET /api/exams/:id/report  — JSON, used to render the admin progress table.
// Cached for a few seconds in Redis (if configured) since a dashboard left open during
// grading polls this repeatedly; any submission/violation change invalidates the cache.
const getReportData = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }

  let rows = await reportCache.getCachedRows(exam._id);
  let fromCache = true;
  if (!rows) {
    rows = await buildReportRows(exam._id);
    fromCache = false;
    await reportCache.setCachedRows(exam._id, rows);
  }

  res.json({ examTitle: exam.title, rows, fromCache });
});

// GET /api/exams/:id/report/questions — per-question pass-rate breakdown across all
// candidates (attempts, correct/pass rate, average marks, how many still need manual grading).
const getQuestionAnalysis = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }

  let questions = await reportCache.getCachedAnalysis(exam._id);
  if (!questions) {
    questions = await buildQuestionAnalysis(exam._id);
    await reportCache.setCachedAnalysis(exam._id, questions);
  }

  res.json({ examTitle: exam.title, questions });
});

// GET /api/exams/:id/report/xlsx
const downloadXlsx = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }
  const buffer = await buildXlsxReport(exam._id, exam.title);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${slug(exam.title)}-report.xlsx"`);
  res.send(buffer);
});

// GET /api/exams/:id/report/pdf
const downloadPdf = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found.');
  }
  const rows = await buildReportRows(exam._id);
  const buffer = await buildPdfReport(exam.title, rows);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${slug(exam.title)}-report.pdf"`);
  res.send(buffer);
});

function slug(title) {
  return (title || 'exam').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

module.exports = { getReportData, getQuestionAnalysis, downloadXlsx, downloadPdf };
