const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadResume,
  screenResume,
  getEvaluationsByAssignment,
  getEvaluationById,
  listAllEvaluations,
  deleteEvaluation,
  downloadResumeFile,
} = require('../controllers/resumeController');
const { requireAdmin } = require('../middleware/auth');

// Configure multer storage for resume uploads
const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `cand-${Date.now().toString(36)}_${basename}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Admin-protected resume screening routes
router.post('/upload', requireAdmin, upload.array('resumes', 20), uploadResume);
router.post('/screen', requireAdmin, screenResume);
router.get('/evaluations', requireAdmin, listAllEvaluations);
router.get('/assignment/:assignmentId', requireAdmin, getEvaluationsByAssignment);
router.get('/evaluation/:id', requireAdmin, getEvaluationById);
router.delete('/evaluation/:id', requireAdmin, deleteEvaluation);

// Public/Admin document download
router.get('/download/:filename', downloadResumeFile);

module.exports = router;
