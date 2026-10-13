const mongoose = require('mongoose');

// A single test case for a coding question.
// `isHidden: true` cases are NEVER returned to the candidate-facing API responses.
const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' }, // stdin
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: true },
    points: { type: Number, default: 1 },
  },
  { _id: true }
);

const starterCodeSchema = new mongoose.Schema(
  {
    language: { type: String, required: true }, // must match a compiler-supported language key
    version: { type: String, required: true },
    code: { type: String, default: '' },
  },
  { _id: false }
);

// One image/video attached to a question's statement. `url` is either a path returned
// by the /api/questions/media upload endpoint (served statically from /uploads/media)
// or any external URL pasted/imported directly.
const questionMediaSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'multi_select', 'true_false', 'fill_blank', 'subjective', 'coding', 'file_upload'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    statement: { type: String, required: true }, // problem statement / question text, markdown supported
    media: [questionMediaSchema], // optional images/videos shown alongside the statement
    constraints: { type: String, default: '' },
    examples: [{ input: String, output: String, explanation: String }],
    marks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    tags: [{ type: String }],
    // Free-text label used purely to batch-add related questions to an exam at once
    // (e.g. everything imported together as "Python Basics Set 1"). Distinct from
    // `type`, which is the question format (mcq/coding/etc). Indexed since the exam
    // editor filters/searches by it.
    group: { type: String, trim: true, default: '', index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },

    // MCQ / multi-select / true-false
    options: [{ text: String, isCorrect: Boolean }],

    // fill in the blank / subjective
    expectedAnswer: { type: String },

    // Coding-specific fields
    starterCode: [starterCodeSchema],
    testCases: [testCaseSchema],
    timeLimitMs: { type: Number, default: 2000 },
    memoryLimitKb: { type: Number, default: 256000 },
    allowedLanguages: [{ type: String }], // e.g. ['python','javascript','cpp']
    customCheckerCode: { type: String, default: null }, // optional checker script, run in same sandbox

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Never leak hidden test case content via default JSON serialization.
// Controllers should still use dedicated "safe" projections for candidate-facing routes,
// but this acts as a last line of defense.
questionSchema.methods.toCandidateSafeJSON = function () {
  const obj = this.toObject();
  obj.testCases = (obj.testCases || [])
    .filter((tc) => !tc.isHidden)
    .map((tc) => ({ _id: tc._id, input: tc.input }));
  delete obj.customCheckerCode;
  if (Array.isArray(obj.options)) {
    obj.options = obj.options.map((o) => ({ _id: o._id, text: o.text })); // strip isCorrect
  }
  delete obj.expectedAnswer;
  return obj;
};

module.exports = mongoose.model('Question', questionSchema);
