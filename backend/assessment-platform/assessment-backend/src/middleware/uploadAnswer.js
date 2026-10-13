const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Mirrors uploadRecording.js's disk-storage pattern: one directory per candidate so
// files never collide across candidates and are trivial to locate for grading/cleanup.
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'answers');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const candidateId = String(req.candidate._id);
    const dir = path.join(UPLOAD_ROOT, candidateId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const questionId = String(req.body.questionId || 'unknown').replace(/[^a-f0-9]/gi, '');
    const ext = path.extname(file.originalname).slice(0, 10) || '';
    cb(null, `${questionId}-${Date.now()}${ext}`);
  },
});

// 25MB is generous for a document/screenshot/zip answer without inviting abuse.
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(pdf|docx?|xlsx?|pptx?|txt|zip|png|jpe?g|csv|json|ipynb)$/i;
    if (!allowedExt.test(file.originalname)) {
      return cb(new Error('Unsupported file type for a file-upload answer.'));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_ROOT };
