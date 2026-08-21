import express from 'express';
import multer from 'multer';
import * as voiceController from '../controllers/voiceController.js';

const router = express.Router();

// Memory storage for voice audio processing (limits: 10MB)
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max audio size
  }
});

router.post('/transcribe', audioUpload.any(), voiceController.transcribe);
router.post('/synthesize', voiceController.synthesize);

export default router;
