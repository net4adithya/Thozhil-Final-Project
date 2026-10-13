const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    type: { type: String, enum: ['webcam', 'screen', 'audio'], required: true },
    filePath: { type: String, required: true }, // path on disk, relative to uploads root
    mimeType: { type: String },
    sizeBytes: { type: Number },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recording', recordingSchema);
