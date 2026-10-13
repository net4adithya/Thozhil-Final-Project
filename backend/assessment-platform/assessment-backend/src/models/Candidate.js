const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'fullscreen_exit',
        'tab_hidden',
        'screen_share_stopped',
        'webcam_denied',
        'copy_paste',
        'devtools',
        'restricted_shortcut',
        'game_bar_shortcut',
      ],
      required: true,
    },
    occurredAt: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },

    // Opaque, unguessable token used in the one-time exam link. Never expose the Mongo _id in URLs.
    accessToken: { type: String, required: true, unique: true, index: true },

    status: {
      type: String,
      enum: ['invited', 'started', 'in_progress', 'submitted', 'auto_submitted', 'expired', 'blocked', 'terminated', 'banned'],
      default: 'invited',
    },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    violationCount: { type: Number, default: 0 },
    violations: [violationSchema],

    // Live recording status, updated by a heartbeat the candidate app sends every few
    // seconds while a MediaRecorder is actually in the "recording" state — separate from
    // the uploaded Recording segments, which only land after the fact. Lets the admin
    // dashboard show "is this candidate's webcam/screen actually capturing right now"
    // instead of just "did we receive a file at some point".
    recording: {
      webcamActive: { type: Boolean, default: false },
      screenActive: { type: Boolean, default: false },
      lastHeartbeatAt: { type: Date },
    },
  },
  { timestamps: true }
);

candidateSchema.index({ exam: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);
