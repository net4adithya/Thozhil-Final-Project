import express from 'express';
import Joi from 'joi';
import * as interviewController from '../controllers/interviewController.js';
import * as questionController from '../controllers/questionController.js';
import * as answerController from '../controllers/answerController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

// Matches UUID format (since we migrated from ObjectID)
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const createInterviewSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Interview title is required'
  }),
  job: Joi.string().pattern(uuidRegex).allow('', null).optional().messages({
    'string.pattern.base': 'Job reference must be a valid UUID'
  }),
  candidate: Joi.string().pattern(uuidRegex).allow('', null).optional().messages({
    'string.pattern.base': 'Candidate reference must be a valid UUID'
  }),
  type: Joi.string().valid('async', 'live').required().messages({
    'any.required': 'Interview type is required (async or live)',
    'any.only': 'Interview type must be either async or live'
  }),
  interviewType: Joi.string().valid('async', 'live').optional(),
  jobRole: Joi.string().allow('', null).optional(),
  department: Joi.string().allow('', null).optional(),
  templateId: Joi.string().allow('', null).optional(),
  company: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('Draft', 'Active', 'Completed', 'Reviewing').default('Active'),
  duration: Joi.number().min(5).max(180),
  questions: Joi.array().items(
    Joi.object({
      id: Joi.string().allow('', null).optional(),
      text: Joi.string().required(),
      category: Joi.string().allow('', null).optional().default('General'),
      difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').allow('', null).optional(),
      type: Joi.string().valid('text', 'code', 'voice').allow('', null).optional(),
      duration: Joi.number().allow(null).optional(),
      timeLimit: Joi.number().allow(null).optional(),
      boilerplate: Joi.string().allow('', null).optional(),
      testCases: Joi.array().optional(),
      questionOrder: Joi.number().optional()
    }).unknown(true)
  ).optional(),
  settings: Joi.object().unknown(true).optional()
});

const updateInterviewSchema = Joi.object({
  title: Joi.string(),
  job: Joi.string().pattern(uuidRegex).allow('', null),
  candidate: Joi.string().pattern(uuidRegex).allow('', null),
  type: Joi.string().valid('async', 'live'),
  interviewType: Joi.string().valid('async', 'live'),
  jobRole: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  templateId: Joi.string().allow('', null),
  company: Joi.string().allow('', null),
  status: Joi.string().valid('Draft', 'Active', 'Completed', 'Reviewing'),
  duration: Joi.number().min(5).max(180),
  questions: Joi.array(),
  settings: Joi.object().unknown(true)
}).unknown(true);

router.route('/')
  .post(validate(createInterviewSchema), interviewController.createInterview)
  .get(interviewController.getInterviews);

router.route('/:id')
  .get(validateObjectId, interviewController.getInterview)
  .put(validateObjectId, validate(updateInterviewSchema), interviewController.updateInterview)
  .delete(validateObjectId, interviewController.deleteInterview);

// Questions endpoints
router.route('/:interviewId/questions')
  .post(questionController.createQuestion)
  .get(questionController.getQuestions);

// Answers endpoints
router.route('/:interviewId/answers')
  .post(answerController.createAnswer)
  .get(answerController.getAnswers);

// Live AI Interview Orchestration Endpoints
router.post('/:id/live/init', validateObjectId, async (req, res, next) => {
  try {
    const { initLiveSession } = await import('../services/ai/liveInterviewService.js');
    const session = await initLiveSession(req.params.id, req.body.candidateId);
    res.status(200).json({
      success: true,
      data: session,
      message: 'Live AI interview session initialized'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/live/turn', validateObjectId, async (req, res, next) => {
  try {
    const { processLiveTurn } = await import('../services/ai/liveInterviewService.js');
    const result = await processLiveTurn(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Live interview turn processed successfully'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/live/complete', validateObjectId, async (req, res, next) => {
  try {
    const { completeLiveSession } = await import('../services/ai/liveInterviewService.js');
    const result = await completeLiveSession(req.params.id, req.body.candidateId);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Live AI interview session completed'
    });
  } catch (err) {
    next(err);
  }
});

// Centralized AI Evaluation endpoints
router.post('/:id/evaluate', validateObjectId, async (req, res, next) => {
  try {
    const { evaluateInterview } = await import('../services/ai/interviewEvaluationService.js');
    const report = await evaluateInterview(req.params.id);
    res.status(200).json({
      success: true,
      data: report,
      message: 'Interview AI evaluation completed successfully'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/evaluation', validateObjectId, async (req, res, next) => {
  try {
    const { getReportByIdOrInterviewId } = await import('../services/reportService.js');
    const report = await getReportByIdOrInterviewId(req.params.id);
    res.status(200).json({
      success: true,
      data: report,
      message: 'Interview evaluation report retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
});

// Multer memory storage configuration for recording uploads
import multer from 'multer';
const recordingUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB maximum for high-quality video sessions
  }
});

// Recording Endpoints
router.post(
  '/:id/recordings',
  validateObjectId,
  recordingUpload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file || (req.files && req.files[0]);
      const { uploadInterviewRecording } = await import('../services/recordingService.js');
      const recording = await uploadInterviewRecording(req.params.id, req.body, file);
      res.status(201).json({
        success: true,
        data: recording,
        message: 'Interview recording uploaded and stored successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id/recordings', validateObjectId, async (req, res, next) => {
  try {
    const { getInterviewRecordings } = await import('../services/recordingService.js');
    const recordings = await getInterviewRecordings(req.params.id);
    res.status(200).json({
      success: true,
      data: recordings,
      message: 'Interview recordings retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
});

// Proctoring Observation Endpoints
router.post('/:id/proctoring-events', validateObjectId, async (req, res, next) => {
  try {
    const { logProctoringEvents } = await import('../services/proctoringService.js');
    const result = await logProctoringEvents(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Proctoring observation events logged successfully'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/proctoring-events', validateObjectId, async (req, res, next) => {
  try {
    const { getProctoringEvents } = await import('../services/proctoringService.js');
    const result = await getProctoringEvents(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Proctoring observation events retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
