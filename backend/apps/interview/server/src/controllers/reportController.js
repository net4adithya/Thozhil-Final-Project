import asyncHandler from '../utils/asyncHandler.js';
import * as reportService from '../services/reportService.js';
import * as interviewEvaluationService from '../services/ai/interviewEvaluationService.js';
import ApiError from '../utils/ApiError.js';

export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.body);
  res.status(201).json({
    success: true,
    data: report,
    message: 'Report created successfully'
  });
});

export const getReports = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  if (req.user?.role === 'Candidate' && req.user.candidateId) {
    filter.candidateId = req.user.candidateId;
  }

  const reports = await reportService.getReports(filter);
  res.status(200).json({
    success: true,
    data: reports,
    message: 'Reports retrieved successfully'
  });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReportByIdOrInterviewId(req.params.id);

  // Candidate authorization check: Candidate can only access their own evaluation report
  if (req.user?.role === 'Candidate' && req.user.candidateId) {
    const reportCandId = report.candidate?.id || report.candidateId || report.candidate_id;
    if (reportCandId && reportCandId !== req.user.candidateId) {
      throw new ApiError(403, 'Access denied: You do not have permission to access another candidate\'s evaluation report.');
    }
  }

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
