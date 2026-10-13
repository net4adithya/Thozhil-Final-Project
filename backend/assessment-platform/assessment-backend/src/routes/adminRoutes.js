const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  listAssignments,
  listInterns,
  getInternAssessmentHistory,
  getUnifiedReport,
  updateAssignmentDecision,
} = require('../controllers/adminController');

router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/assignments', listAssignments);
router.get('/assignments/:id/report', getUnifiedReport);
router.post('/assignments/:id/decision', updateAssignmentDecision);
router.get('/interns', listInterns);
router.get('/interns/:id/assessment-history', getInternAssessmentHistory);

module.exports = router;
