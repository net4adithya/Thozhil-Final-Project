import * as interviewService from '../services/interviewService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import ApiError from '../utils/ApiError.js';

export const createInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.createInterview(req.body);
  res.status(201).json({
    success: true,
    data: interview,
    message: 'Interview created successfully'
  });
});

export const getInterviews = asyncHandler(async (req, res) => {
  const filter = { ...req.query };

  // Strict Candidate Scoping: If request is from a Candidate, enforce candidateId
  if (req.user?.role === 'Candidate' && req.user.candidateId) {
    filter.candidateId = req.user.candidateId;
  }

  const interviews = await interviewService.queryInterviews(filter);
  res.status(200).json({
    success: true,
    data: interviews,
    message: 'Interviews retrieved successfully'
  });
});

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.getInterviewById(req.params.id);

  // Authorization check: Candidate can only access interviews assigned to them
  if (req.user?.role === 'Candidate' && req.user.candidateId) {
    const isAssigned =
      interview.candidate_id === req.user.candidateId ||
      interview.candidateId === req.user.candidateId ||
      interview.candidate?.id === req.user.candidateId;

    if (!isAssigned) {
      throw new ApiError(403, 'Access denied: You do not have permission to access this assessment track.');
    }
  }

  res.status(200).json({
    success: true,
    data: interview,
    message: 'Interview retrieved successfully'
  });
});

export const updateInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.updateInterviewById(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: interview,
    message: 'Interview updated successfully'
  });
});

export const deleteInterview = asyncHandler(async (req, res) => {
  await interviewService.deleteInterviewById(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: 'Interview deleted successfully'
  });
});
