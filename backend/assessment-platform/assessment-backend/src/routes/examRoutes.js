const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const {
  createExam,
  listExams,
  getExam,
  updateExam,
  deleteExam,
  attachQuestions,
  inviteCandidates,
  listCandidates,
} = require('../controllers/examController');
const { getReportData, getQuestionAnalysis, downloadXlsx, downloadPdf } = require('../controllers/reportController');
const {
  getCandidateSubmission,
  gradeAnswer,
  recordDecision,
  triggerGeminiReview,
  downloadAnswerFile,
} = require('../controllers/submissionController');

router.use(requireAdmin);

router.post('/', createExam);
router.get('/', listExams);
router.get('/:id', getExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);
router.post('/:id/questions', attachQuestions);
router.post('/:id/candidates', inviteCandidates);
router.get('/:id/candidates', listCandidates);
router.get('/:id/report', getReportData);
router.get('/:id/report/questions', getQuestionAnalysis);
router.get('/:id/report/xlsx', downloadXlsx);
router.get('/:id/report/pdf', downloadPdf);

router.get('/:id/candidates/:candidateId/submission', getCandidateSubmission);
router.post('/:id/candidates/:candidateId/submission/grade', gradeAnswer);
router.post('/:id/candidates/:candidateId/submission/decision', recordDecision);
router.post('/:id/candidates/:candidateId/submission/gemini-review', triggerGeminiReview);
router.get('/:id/candidates/:candidateId/submission/answers/:questionId/download', downloadAnswerFile);

module.exports = router;
