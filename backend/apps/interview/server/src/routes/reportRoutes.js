import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.post('/', reportController.createReport);
router.get('/', reportController.getReports);
router.get('/analytics', reportController.getAnalytics);
router.post('/evaluate/:id', validateObjectId, reportController.evaluateInterview);
router.post('/interview/:id/evaluate', validateObjectId, reportController.evaluateInterview);
router.get('/interview/:id', validateObjectId, reportController.getReport);
router.get('/:id', validateObjectId, reportController.getReport);

export default router;
