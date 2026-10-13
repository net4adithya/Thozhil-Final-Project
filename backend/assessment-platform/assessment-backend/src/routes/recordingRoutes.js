const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { listRecordingsForCandidate, downloadRecording } = require('../controllers/recordingController');

router.get('/exams/:examId/candidates/:candidateId/recordings', requireAdmin, listRecordingsForCandidate);
router.get('/recordings/:id/download', requireAdmin, downloadRecording);

module.exports = router;
