import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import * as resumeController from '../controllers/resumeController.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.post('/', upload.any(), resumeController.uploadResume);
router.get('/:id', validateObjectId, resumeController.getResume);
router.post('/:id/process', validateObjectId, resumeController.processResume);
router.post('/:id/extract', validateObjectId, resumeController.processResume);
router.post('/:id/screen', validateObjectId, resumeController.screenResume);

export default router;
