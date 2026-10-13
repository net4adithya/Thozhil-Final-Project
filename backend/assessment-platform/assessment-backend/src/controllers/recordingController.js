const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Recording = require('../models/Recording');
const Candidate = require('../models/Candidate');
const { UPLOAD_ROOT } = require('../middleware/uploadRecording');

// POST /api/exam/:token/recordings  (multipart: file, type, startedAt, endedAt)
// Candidate-facing. Called once per recording segment when MediaRecorder stops
// (either at exam end, or periodically to cap in-memory buffer size).
const uploadRecording = asyncHandler(async (req, res) => {
  const { exam, candidate } = req;
  const { type, startedAt, endedAt } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error('No recording file received.');
  }
  if (!['webcam', 'screen', 'audio'].includes(type)) {
    res.status(400);
    throw new Error('type must be webcam, screen, or audio.');
  }

  const relativePath = path.relative(UPLOAD_ROOT, req.file.path);
  const recording = await Recording.create({
    exam: exam._id,
    candidate: candidate._id,
    type,
    filePath: relativePath,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    endedAt: endedAt ? new Date(endedAt) : new Date(),
  });

  res.status(201).json({ id: recording._id, saved: true });
});

// GET /api/exams/:examId/candidates/:candidateId/recordings  (admin)
const listRecordingsForCandidate = asyncHandler(async (req, res) => {
  const { examId, candidateId } = req.params;
  const candidate = await Candidate.findOne({ _id: candidateId, exam: examId });
  if (!candidate) {
    res.status(404);
    throw new Error('Candidate not found for this exam.');
  }
  const recordings = await Recording.find({ exam: examId, candidate: candidateId }).sort({
    startedAt: 1,
  });
  res.json(recordings);
});

// GET /api/recordings/:id/download  (admin)
const downloadRecording = asyncHandler(async (req, res) => {
  const recording = await Recording.findById(req.params.id);
  if (!recording) {
    res.status(404);
    throw new Error('Recording not found.');
  }
  const absolutePath = path.join(UPLOAD_ROOT, recording.filePath);
  if (!absolutePath.startsWith(UPLOAD_ROOT) || !fs.existsSync(absolutePath)) {
    res.status(404);
    throw new Error('Recording file is missing on disk.');
  }
  res.download(absolutePath);
});

module.exports = { uploadRecording, listRecordingsForCandidate, downloadRecording };
