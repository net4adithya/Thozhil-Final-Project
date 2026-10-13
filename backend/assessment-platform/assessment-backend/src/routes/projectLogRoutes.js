const router = require('express').Router();
const {
  submitProjectLog,
  getLogsByAssignment,
  updateManagerNotes,
} = require('../controllers/projectLogController');
const { requireAdmin } = require('../middleware/auth');

// Intern & Admin submission endpoint
router.post('/submit', submitProjectLog);

// Admin-protected review and risk assessment endpoints
router.get('/assignment/:assignmentId', requireAdmin, getLogsByAssignment);
router.post('/review/:id/notes', requireAdmin, updateManagerNotes);

module.exports = router;
