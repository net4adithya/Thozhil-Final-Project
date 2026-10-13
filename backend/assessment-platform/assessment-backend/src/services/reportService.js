const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const Candidate = require('../models/Candidate');
const Submission = require('../models/Submission');
const Question = require('../models/Question');

/**
 * Gathers one row per candidate: score, percentage, time spent, violation count.
 * Shared by both the XLSX and PDF exporters so the two formats never disagree.
 */
async function buildReportRows(examId) {
  const candidates = await Candidate.find({ exam: examId }).select('-accessToken');
  const submissions = await Submission.find({ exam: examId });
  const submissionByCandidate = new Map(submissions.map((s) => [String(s.candidate), s]));

  return candidates.map((c) => {
    const sub = submissionByCandidate.get(String(c._id));
    const awarded = sub?.totalMarksAwarded ?? 0;
    const possible = sub?.totalMarksPossible ?? 0;
    const percentage = possible > 0 ? Math.round((awarded / possible) * 1000) / 10 : 0;
    const timeSpentMin =
      c.startedAt && c.submittedAt
        ? Math.round((new Date(c.submittedAt) - new Date(c.startedAt)) / 60000)
        : null;

    return {
      name: c.name,
      email: c.email,
      status: c.status,
      marksAwarded: awarded,
      marksPossible: possible,
      percentage,
      timeSpentMin,
      violationCount: c.violationCount,
      submittedAt: c.submittedAt ? new Date(c.submittedAt).toISOString() : '',
    };
  });
}

/**
 * Per-question breakdown across every candidate who has a (final) submission for this
 * exam: attempt count, correct/pass count and rate, and average marks awarded. This is
 * the "question-level analysis" the per-candidate report never showed — useful for
 * spotting a badly worded question (near-0% pass rate) or a trivial one (near-100%).
 */
async function buildQuestionAnalysis(examId) {
  const submissions = await Submission.find({ exam: examId, isFinal: true });
  const questionIds = new Set();
  submissions.forEach((s) => s.answers.forEach((a) => questionIds.add(String(a.question))));

  const questions = await Question.find({ _id: { $in: [...questionIds] } }).select(
    'title type marks'
  );
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  const stats = new Map();
  for (const qid of questionIds) {
    const q = questionMap.get(qid);
    if (!q) continue;
    stats.set(qid, {
      questionId: qid,
      title: q.title,
      type: q.type,
      marks: q.marks,
      attempts: 0,
      gradedAttempts: 0,
      correctCount: 0,
      marksAwardedSum: 0,
    });
  }

  for (const sub of submissions) {
    for (const answer of sub.answers) {
      const s = stats.get(String(answer.question));
      if (!s) continue;
      const attempted =
        (answer.selectedOptionIds && answer.selectedOptionIds.length > 0) ||
        (answer.textAnswer && answer.textAnswer.trim().length > 0) ||
        (answer.code && answer.code.trim().length > 0) ||
        !!answer.fileUrl;
      if (!attempted) continue;

      s.attempts += 1;
      s.marksAwardedSum += answer.marksAwarded || 0;
      if (answer.isCorrect === true) s.correctCount += 1;
      if (answer.isCorrect !== null) s.gradedAttempts += 1;
    }
  }

  return [...stats.values()]
    .map((s) => ({
      ...s,
      passRate: s.gradedAttempts > 0 ? Math.round((s.correctCount / s.gradedAttempts) * 1000) / 10 : null,
      avgMarksAwarded: s.attempts > 0 ? Math.round((s.marksAwardedSum / s.attempts) * 100) / 100 : 0,
      needsManualGrading: s.attempts - s.gradedAttempts,
    }))
    .sort((a, b) => (a.passRate ?? 101) - (b.passRate ?? 101));
}

async function buildXlsxReport(examId, examTitle) {
  const rows = await buildReportRows(examId);
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Name: r.name,
      Email: r.email,
      Status: r.status,
      'Marks Awarded': r.marksAwarded,
      'Marks Possible': r.marksPossible,
      'Percentage (%)': r.percentage,
      'Time Spent (min)': r.timeSpentMin ?? '',
      Violations: r.violationCount,
      'Submitted At': r.submittedAt,
    }))
  );
  worksheet['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 11 }, { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, examTitle.slice(0, 31) || 'Report');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function buildPdfReport(examTitle, rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(examTitle, { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    const columns = [
      { key: 'name', label: 'Name', width: 130 },
      { key: 'email', label: 'Email', width: 170 },
      { key: 'status', label: 'Status', width: 90 },
      { key: 'marksAwarded', label: 'Score', width: 60 },
      { key: 'marksPossible', label: 'Out of', width: 60 },
      { key: 'percentage', label: '%', width: 50 },
      { key: 'timeSpentMin', label: 'Time (min)', width: 70 },
      { key: 'violationCount', label: 'Violations', width: 70 },
    ];

    let y = doc.y;
    const startX = doc.x;
    doc.fontSize(9).fillColor('#000');

    function drawRow(values, isHeader) {
      let x = startX;
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      columns.forEach((col, i) => {
        doc.text(String(values[i] ?? ''), x, y, { width: col.width, ellipsis: true });
        x += col.width;
      });
      y += 18;
      if (y > doc.page.height - 60) {
        doc.addPage({ margin: 40, size: 'A4', layout: 'landscape' });
        y = doc.y;
      }
    }

    drawRow(columns.map((c) => c.label), true);
    doc.moveTo(startX, y - 4).lineTo(startX + columns.reduce((s, c) => s + c.width, 0), y - 4).stroke();

    rows.forEach((r) => {
      drawRow(columns.map((c) => r[c.key]), false);
    });

    doc.end();
  });
}

module.exports = { buildReportRows, buildQuestionAnalysis, buildXlsxReport, buildPdfReport };
