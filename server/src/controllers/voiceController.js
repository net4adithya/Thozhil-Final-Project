import asyncHandler from '../utils/asyncHandler.js';
import * as sarvamService from '../services/voice/sarvamService.js';
import ApiError from '../utils/ApiError.js';

export const transcribe = asyncHandler(async (req, res) => {
  const file = req.file || (req.files && (req.files.find?.(f => f.fieldname === 'file' || f.fieldname === 'audio') || req.files[0]));
  if (!file) {
    throw new ApiError(400, 'Audio file is required for transcription');
  }

  const languageCode = req.body.languageCode || req.body.language_code || 'en-IN';
  const result = await sarvamService.transcribeSpeech(
    file.buffer,
    file.mimetype || 'audio/wav',
    file.originalname || 'audio.wav',
    languageCode
  );

  res.status(200).json({
    success: true,
    data: result,
    message: 'Speech transcribed successfully'
  });
});

export const synthesize = asyncHandler(async (req, res) => {
  const { text, targetLanguageCode, speaker, pace, pitch } = req.body;
  if (!text) {
    throw new ApiError(400, 'Text parameter is required for speech synthesis');
  }

  const result = await sarvamService.synthesizeSpeech(text, {
    targetLanguageCode,
    speaker,
    pace,
    pitch
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Speech synthesized successfully'
  });
});
