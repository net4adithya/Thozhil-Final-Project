const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Question images/videos are served publicly (candidates view them with no admin auth,
// same as any other static exam asset) from this directory — mirrors the
// uploadRecording.js / uploadAnswer.js disk-storage pattern used elsewhere.
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'media');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    cb(null, UPLOAD_ROOT);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10) || '';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

// 50MB covers a decent explainer clip while keeping this a "small attachment" upload
// rather than something that should go through the recording pipeline.
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('File must be an image (png/jpg/gif/webp) or video (mp4/webm).'));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_ROOT };
