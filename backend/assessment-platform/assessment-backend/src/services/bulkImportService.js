const XLSX = require('xlsx');
const Question = require('../models/Question');

// Column contract for bulk import (CSV or XLSX, same columns either way).
// Multi-value fields are pipe-separated within a single cell, e.g.:
//   options: "2|3|4|5"        correctOptions: "2" (1-based index, pipe-separated for multi_select)
//   testCaseInputs / testCaseOutputs / testCaseHidden: pipe-separated, same order/length
//   media: "image:https://example.com/a.png|video:https://example.com/b.mp4" (kind:url pairs)
//   group: a single free-text label — give the same value to every row that should be
//          addable to an exam in one click from the exam editor's "Add by group" picker.
const REQUIRED_COLUMNS = ['type', 'title', 'statement', 'marks'];
const VALID_TYPES = ['mcq', 'multi_select', 'true_false', 'fill_blank', 'subjective', 'coding', 'file_upload'];

function parseFile(buffer, originalName) {
  const isJson =
    /\.json$/i.test(originalName || '') || looksLikeJsonBuffer(buffer);

  if (isJson) {
    const text = buffer.toString('utf8');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`Could not parse JSON file: ${err.message}`);
    }
    const rows = Array.isArray(parsed) ? parsed : parsed.questions;
    if (!Array.isArray(rows)) {
      throw new Error('JSON import must be an array of question objects, or { "questions": [...] }.');
    }
    // JSON rows may use real arrays for multi-value fields (options, tags, testCases...)
    // instead of the pipe-separated strings CSV/XLSX cells require. Normalize down to the
    // same pipe-separated row shape so validateRow() only has to handle one format.
    return rows.map(normalizeJsonRow);
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // raw:false returns each cell's *displayed* text rather than its internal stored
  // value. Matters most for a version-looking cell (e.g. "3.12") that a spreadsheet
  // app auto-reformatted as a date — without this, SheetJS hands back the raw date
  // serial number (e.g. 36597.00011574074) instead of anything resembling "3.12".
  // Numeric columns (marks, timeLimitMs, ...) still parse fine since Number("30")
  // works the same as Number(30).
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

function looksLikeJsonBuffer(buffer) {
  const head = buffer.slice(0, 32).toString('utf8').trim();
  return head.startsWith('[') || head.startsWith('{');
}

function toPipe(value) {
  if (Array.isArray(value)) return value.join('|');
  return value === undefined || value === null ? '' : String(value);
}

/**
 * languageVersion accepts either one bare value applied to every allowed language
 * ("3.12.0", "latest" — the common case for single-language questions) or, when a
 * question allows several languages that need different runtimes, per-language pairs
 * in the same "kind:value" shape the media column uses:
 *   "python:3.12.0|javascript:18.15.0"
 */
function parseLanguageVersions(raw, languages) {
  const value = String(raw ?? '').trim();
  const map = {};
  if (!value) return map;

  const entries = value.split('|').map((s) => s.trim()).filter(Boolean);
  const isPerLanguage = entries.length > 0 && entries.every((e) => e.includes(':'));
  if (isPerLanguage) {
    entries.forEach((e) => {
      const idx = e.indexOf(':');
      const lang = e.slice(0, idx).trim().toLowerCase();
      const version = e.slice(idx + 1).trim();
      if (lang) map[lang] = version;
    });
  } else {
    languages.forEach((l) => {
      map[l] = value;
    });
  }
  return map;
}

// Catches the "Excel silently turned a version-like cell into a date" failure class
// (e.g. typing "3.12" produces the serial number 36597.00011574074) before it reaches
// the compiler and fails as a cryptic "runtime is unknown" mid-exam. Real version
// segments (major/minor/patch) are small integers — a long run of digits in any
// segment is the tell.
function looksLikeCorruptedVersion(version) {
  if (!version || version === 'latest') return false;
  return String(version)
    .split('.')
    .some((segment) => /^\d+$/.test(segment) && segment.replace(/^0+/, '').length > 4);
}

/**
 * Converts one JSON row into the same flat, pipe-separated-string shape produced by
 * reading a CSV/XLSX cell, so the rest of the pipeline (validateRow, duplicate
 * detection, preview/confirm) works identically no matter which format was uploaded.
 */
function normalizeJsonRow(row) {
  const out = { ...row };

  if (Array.isArray(row.options)) {
    // Accept either ["opt1","opt2",...] + separate correctOptions indexes, or
    // [{text, isCorrect}, ...] objects (closer to the actual Question schema).
    if (row.options.length && typeof row.options[0] === 'object') {
      out.options = toPipe(row.options.map((o) => o.text));
      out.correctOptions = toPipe(
        row.options
          .map((o, i) => (o.isCorrect ? i + 1 : null))
          .filter((i) => i !== null)
      );
    } else {
      out.options = toPipe(row.options);
    }
  }
  if (Array.isArray(row.correctOptions)) out.correctOptions = toPipe(row.correctOptions);
  if (Array.isArray(row.tags)) out.tags = toPipe(row.tags);
  if (Array.isArray(row.allowedLanguages)) out.allowedLanguages = toPipe(row.allowedLanguages);

  if (Array.isArray(row.media)) {
    // [{kind, url}, ...] -> "kind:url|kind:url" so it round-trips through the same
    // pipe-separated cell shape as everything else.
    out.media = toPipe(row.media.map((m) => `${m.kind || 'image'}:${m.url || ''}`));
  }

  if (Array.isArray(row.testCases)) {
    // [{input, expectedOutput, isHidden}, ...] -> three parallel pipe-separated columns.
    out.testCaseInputs = toPipe(row.testCases.map((tc) => tc.input ?? ''));
    out.testCaseOutputs = toPipe(row.testCases.map((tc) => tc.expectedOutput ?? ''));
    out.testCaseHidden = toPipe(row.testCases.map((tc) => (tc.isHidden === false ? 'false' : 'true')));
  } else {
    if (Array.isArray(row.testCaseInputs)) out.testCaseInputs = toPipe(row.testCaseInputs);
    if (Array.isArray(row.testCaseOutputs)) out.testCaseOutputs = toPipe(row.testCaseOutputs);
    if (Array.isArray(row.testCaseHidden)) out.testCaseHidden = toPipe(row.testCaseHidden);
  }

  return out;
}

function splitPipe(value) {
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Validates and transforms one raw row into a Question-shaped object plus any errors.
 * Never throws — always returns { row, data, errors } so the caller can report
 * row-level problems without aborting the whole batch.
 */
function validateRow(row, index) {
  const errors = [];
  const rowNum = index + 2; // +2: 1-indexed, plus header row

  for (const col of REQUIRED_COLUMNS) {
    if (row[col] === undefined || String(row[col]).trim() === '') {
      errors.push(`Row ${rowNum}: missing required column "${col}"`);
    }
  }

  const type = String(row.type || '').trim().toLowerCase();
  if (type && !VALID_TYPES.includes(type)) {
    errors.push(`Row ${rowNum}: invalid type "${row.type}". Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  const marks = Number(row.marks);
  if (row.marks !== undefined && row.marks !== '' && Number.isNaN(marks)) {
    errors.push(`Row ${rowNum}: marks must be a number`);
  }

  const data = {
    type,
    title: String(row.title || '').trim(),
    statement: String(row.statement || '').trim(),
    constraints: String(row.constraints || '').trim(),
    marks: Number.isNaN(marks) ? 0 : marks,
    negativeMarks: Number(row.negativeMarks) || 0,
    difficulty: ['easy', 'medium', 'hard'].includes(row.difficulty) ? row.difficulty : 'medium',
    tags: splitPipe(row.tags),
    group: String(row.group || '').trim(),
  };

  const mediaEntries = splitPipe(row.media);
  if (mediaEntries.length) {
    data.media = [];
    mediaEntries.forEach((entry, i) => {
      const sepIdx = entry.indexOf(':');
      if (sepIdx === -1) {
        errors.push(`Row ${rowNum}: media entry "${entry}" must be "image:<url>" or "video:<url>"`);
        return;
      }
      const kind = entry.slice(0, sepIdx).trim().toLowerCase();
      const url = entry.slice(sepIdx + 1).trim();
      if (!['image', 'video'].includes(kind)) {
        errors.push(`Row ${rowNum}: media entry ${i + 1} has invalid kind "${kind}" — must be "image" or "video"`);
        return;
      }
      if (!url) {
        errors.push(`Row ${rowNum}: media entry ${i + 1} is missing a URL`);
        return;
      }
      data.media.push({ kind, url });
    });
  }

  if (['mcq', 'multi_select', 'true_false'].includes(type)) {
    const optionTexts = splitPipe(row.options);
    const correctIndexes = splitPipe(row.correctOptions).map((n) => parseInt(n, 10));

    if (type === 'true_false') {
      data.options = [
        { text: 'True', isCorrect: String(row.correctOptions).trim().toLowerCase() === 'true' },
        { text: 'False', isCorrect: String(row.correctOptions).trim().toLowerCase() === 'false' },
      ];
    } else {
      if (optionTexts.length < 2) {
        errors.push(`Row ${rowNum}: ${type} needs at least 2 pipe-separated options`);
      }
      if (correctIndexes.length === 0) {
        errors.push(`Row ${rowNum}: correctOptions must list at least one 1-based option index`);
      }
      data.options = optionTexts.map((text, i) => ({
        text,
        isCorrect: correctIndexes.includes(i + 1),
      }));
      if (data.options.length && !data.options.some((o) => o.isCorrect)) {
        errors.push(`Row ${rowNum}: no option matched correctOptions indexes — check numbering`);
      }
    }
  }

  if (['fill_blank', 'subjective'].includes(type)) {
    data.expectedAnswer = String(row.expectedAnswer || '').trim();
  }

  if (type === 'coding') {
    const inputs = splitPipe(row.testCaseInputs);
    const outputs = splitPipe(row.testCaseOutputs);
    const hiddenFlags = splitPipe(row.testCaseHidden);

    if (outputs.length === 0) {
      errors.push(`Row ${rowNum}: coding questions need at least one testCaseOutputs value`);
    }
    if (inputs.length && inputs.length !== outputs.length) {
      errors.push(`Row ${rowNum}: testCaseInputs and testCaseOutputs must have the same count`);
    }

    data.testCases = outputs.map((expectedOutput, i) => ({
      input: inputs[i] || '',
      expectedOutput,
      isHidden: (hiddenFlags[i] || 'true').toLowerCase() !== 'false',
      points: 1,
    }));

    data.allowedLanguages = splitPipe(row.allowedLanguages);
    const versionMap = parseLanguageVersions(row.languageVersion, data.allowedLanguages);
    data.starterCode = data.allowedLanguages.map((language) => ({
      language,
      version: versionMap[language] || 'latest',
      code: '',
    }));
    data.timeLimitMs = Number(row.timeLimitMs) || 2000;
    data.memoryLimitKb = Number(row.memoryLimitKb) || 256000;

    if (data.allowedLanguages.length === 0) {
      errors.push(`Row ${rowNum}: coding questions need allowedLanguages (pipe-separated)`);
    }
    data.starterCode.forEach(({ language, version }) => {
      if (looksLikeCorruptedVersion(version)) {
        errors.push(
          `Row ${rowNum}: languageVersion "${version}" for ${language} looks like a spreadsheet date/number, not a real version — Excel/Sheets sometimes silently auto-converts version-like text (e.g. "3.12") into a date if the column isn't formatted as Text. Format that column as Text, re-enter the version (or "latest"), and re-export.`
        );
      }
    });
  }

  return { row: rowNum, data, errors };
}

/**
 * Detects likely duplicates within the batch (exact title match) so admins can
 * catch copy-paste mistakes in the import sheet before committing.
 */
function detectDuplicates(validatedRows) {
  const seen = new Map();
  for (const r of validatedRows) {
    const key = r.data.title.toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      r.errors.push(`Row ${r.row}: duplicate title within this file (also row ${seen.get(key)})`);
    } else {
      seen.set(key, r.row);
    }
  }
  return validatedRows;
}

async function detectExistingDuplicates(validatedRows) {
  const titles = validatedRows.map((r) => r.data.title).filter(Boolean);
  if (titles.length === 0) return validatedRows;
  const existing = await Question.find({ title: { $in: titles } }).select('title');
  const existingTitles = new Set(existing.map((q) => q.title.toLowerCase()));
  for (const r of validatedRows) {
    if (existingTitles.has(r.data.title.toLowerCase())) {
      r.errors.push(`Row ${r.row}: a question titled "${r.data.title}" already exists in the bank`);
    }
  }
  return validatedRows;
}

/**
 * Full preview pipeline: parse file -> validate each row -> flag in-file and
 * existing-DB duplicates. Returns rows with errors alongside clean rows;
 * nothing is written to the database at this stage.
 */
async function previewImport(buffer, originalName) {
  const rawRows = parseFile(buffer, originalName);
  if (rawRows.length === 0) {
    return { rows: [], summary: { total: 0, valid: 0, invalid: 0 } };
  }

  let validatedRows = rawRows.map(validateRow);
  validatedRows = detectDuplicates(validatedRows);
  validatedRows = await detectExistingDuplicates(validatedRows);

  const valid = validatedRows.filter((r) => r.errors.length === 0).length;
  return {
    rows: validatedRows,
    summary: { total: validatedRows.length, valid, invalid: validatedRows.length - valid },
  };
}

/**
 * Builds one flat row per question, in the exact column shape the bulk-import template
 * expects — so a bank exported here can be re-imported unchanged (round-trippable),
 * and admins can bulk-edit offline in a spreadsheet.
 */
function questionToRow(q) {
  const row = {
    type: q.type,
    title: q.title,
    statement: q.statement,
    constraints: q.constraints || '',
    marks: q.marks,
    negativeMarks: q.negativeMarks || 0,
    difficulty: q.difficulty || 'medium',
    tags: (q.tags || []).join('|'),
    group: q.group || '',
    media: (q.media || []).map((m) => `${m.kind}:${m.url}`).join('|'),
  };

  if (['mcq', 'multi_select'].includes(q.type)) {
    row.options = (q.options || []).map((o) => o.text).join('|');
    row.correctOptions = (q.options || [])
      .map((o, i) => (o.isCorrect ? i + 1 : null))
      .filter((i) => i !== null)
      .join('|');
  } else if (q.type === 'true_false') {
    const correct = (q.options || []).find((o) => o.isCorrect);
    row.correctOptions = correct ? correct.text : '';
  }

  if (['fill_blank', 'subjective'].includes(q.type)) {
    row.expectedAnswer = q.expectedAnswer || '';
  }

  if (q.type === 'coding') {
    row.testCaseInputs = (q.testCases || []).map((tc) => tc.input || '').join('|');
    row.testCaseOutputs = (q.testCases || []).map((tc) => tc.expectedOutput || '').join('|');
    row.testCaseHidden = (q.testCases || []).map((tc) => (tc.isHidden === false ? 'false' : 'true')).join('|');
    row.allowedLanguages = (q.allowedLanguages || []).join('|');
    // Always export per-language ("lang:version|lang:version"), even for a single
    // language, so re-importing an exported file round-trips correctly regardless of
    // how many languages a question allows — see parseLanguageVersions.
    row.languageVersion = (q.starterCode || []).map((s) => `${s.language}:${s.version}`).join('|');
    row.timeLimitMs = q.timeLimitMs;
    row.memoryLimitKb = q.memoryLimitKb;
  }

  return row;
}

function exportToXlsxBuffer(questions) {
  const rows = questions.map(questionToRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function exportToCsvBuffer(questions) {
  const rows = questions.map(questionToRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  return Buffer.from(XLSX.utils.sheet_to_csv(worksheet), 'utf8');
}

module.exports = {
  previewImport,
  validateRow,
  parseFile,
  questionToRow,
  exportToXlsxBuffer,
  exportToCsvBuffer,
  looksLikeCorruptedVersion,
};