const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'recordings');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const candidateId = String(req.candidate._id);
    const dir = path.join(UPLOAD_ROOT, candidateId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const type = (req.body.type || 'recording').replace(/[^a-z]/gi, '');
    const ext = (file.mimetype.split('/')[1] || 'webm').split(';')[0];
    cb(null, `${type}-${Date.now()}.${ext}`);
  },
});

// Recordings can run for a while at modest bitrate; 500MB is a generous ceiling per file.
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/webm', 'video/mp4', 'audio/webm', 'audio/ogg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error(`Unsupported recording mime type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_ROOT };
