import * as interviewService from '../services/interviewService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.createInterview(req.body);
  res.status(201).json({
    success: true,
    data: interview,
    message: 'Interview created successfully'
  });
});

export const getInterviews = asyncHandler(async (req, res) => {
  const interviews = await interviewService.queryInterviews();
  res.status(200).json({
    success: true,
    data: interviews,
    message: 'Interviews retrieved successfully'
  });
});

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.getInterviewById(req.params.id);
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
