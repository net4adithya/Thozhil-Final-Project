const mongoose = require('mongoose');

const testCaseResultSchema = new mongoose.Schema(
  {
    testCaseId: { type: mongoose.Schema.Types.ObjectId, required: true },
    isHidden: { type: Boolean, required: true },
    passed: { type: Boolean, required: true },
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    stdout: { type: String },
    stderr: { type: String },
    timeMs: { type: Number },
    memoryKb: { type: Number },
    exitCode: { type: Number },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    type: { type: String, required: true },

    // MCQ / multi-select / true-false
    selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],

    // fill in blank / subjective
    textAnswer: { type: String },

    // coding
    code: { type: String },
    language: { type: String },
    testCaseResults: [testCaseResultSchema],
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },

    // file upload
    fileUrl: { type: String },
    originalName: { type: String },

    marksAwarded: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: null },
    gradedAt: { type: Date },
    feedback: { type: String, default: '' },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Gemini AI review for coding answers
    geminiReview: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    answers: [answerSchema],
    totalMarksAwarded: { type: Number, default: 0 },
    totalMarksPossible: { type: Number, default: 0 },
    submittedAt: { type: Date },
    isFinal: { type: Boolean, default: false },

    // Authority review fields (never exposed to candidate-facing APIs)
    authorityDecision: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'resubmit_requested'],
      default: 'pending',
    },
    privateNotes: { type: String, default: '' },
    decidedAt: { type: Date },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

submissionSchema.index({ exam: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
