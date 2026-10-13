const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/uploadImport');
const { upload: uploadMedia } = require('../middleware/uploadMedia');
const {
  createQuestion,
  listQuestions,
  listGroups,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  exportQuestions,
  uploadQuestionMedia,
} = require('../controllers/questionController');
const { preview, confirm } = require('../controllers/bulkImportController');

router.use(requireAdmin);

router.post('/bulk-import/preview', upload.single('file'), preview);
router.post('/bulk-import/confirm', confirm);

router.get('/export', exportQuestions);
router.get('/groups', listGroups);
router.post('/media', uploadMedia.single('file'), uploadQuestionMedia);

router.post('/', createQuestion);
router.get('/', listQuestions);
router.get('/:id', getQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
