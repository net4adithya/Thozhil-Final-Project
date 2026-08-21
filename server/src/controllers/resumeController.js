import asyncHandler from '../utils/asyncHandler.js';
import * as resumeService from '../services/resumeService.js';
import * as resumeScreeningService from '../services/ai/resumeScreeningService.js';
import ApiError from '../utils/ApiError.js';

export const uploadResume = asyncHandler(async (req, res) => {
  const candidateId = req.body.candidateId || req.body.candidate;
  if (!candidateId) {
    throw new ApiError(400, 'Candidate ID is required to associate resume');
  }

  const file = req.file || (req.files && (req.files.find?.(f => f.fieldname === 'file' || f.fieldname === 'resume') || req.files[0]));
  if (!file) {
    throw new ApiError(400, 'Please upload a resume file');
  }

  const resume = await resumeService.createResume(candidateId, file);

  res.status(201).json({
    success: true,
    data: resume,
    message: 'Resume uploaded and associated successfully'
  });
});

export const getResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResumeById(req.params.id);
  res.status(200).json({
    success: true,
    data: resume,
    message: 'Resume retrieved successfully'
  });
});

export const processResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.processResume(req.params.id);
  res.status(200).json({
    success: true,
    data: resume,
    message: 'Resume text extracted and processed successfully'
  });
});

export const screenResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { jobId } = req.body;
  const result = await resumeScreeningService.screenResume(id, { jobId });
  res.status(200).json({
    success: true,
    data: result,
    message: 'Resume AI screening completed successfully'
  });
});
