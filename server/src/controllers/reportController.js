import asyncHandler from '../utils/asyncHandler.js';
import * as reportService from '../services/reportService.js';
import * as interviewEvaluationService from '../services/ai/interviewEvaluationService.js';

export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.body);
  res.status(201).json({
    success: true,
    data: report,
    message: 'Report created successfully'
  });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReportByIdOrInterviewId(req.params.id);
  res.status(200).json({
    success: true,
    data: report,
    message: 'Report retrieved successfully'
  });
});

export const evaluateInterview = asyncHandler(async (req, res) => {
  const interviewId = req.params.interviewId || req.params.id;
  const report = await interviewEvaluationService.evaluateAsyncInterview(interviewId);
  res.status(200).json({
    success: true,
    data: report,
    message: 'Async interview AI evaluation completed successfully'
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await reportService.getAnalytics();
  res.status(200).json({
    success: true,
    data: analytics,
    message: 'Analytics retrieved successfully'
  });
});
