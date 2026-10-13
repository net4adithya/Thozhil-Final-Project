import * as jobService from '../services/jobService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.body);
  res.status(201).json({
    success: true,
    data: job,
    message: 'Job opening created successfully'
  });
});

export const getJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.queryJobs();
  res.status(200).json({
    success: true,
    data: jobs,
    message: 'Job openings retrieved successfully'
  });
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.params.id);
  res.status(200).json({
    success: true,
    data: job,
    message: 'Job opening retrieved successfully'
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJobById(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: job,
    message: 'Job opening updated successfully'
  });
});

export const deleteJob = asyncHandler(async (req, res) => {
  await jobService.deleteJobById(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: 'Job opening deleted successfully'
  });
});
