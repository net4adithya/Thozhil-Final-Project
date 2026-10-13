import asyncHandler from '../utils/asyncHandler.js';
import * as candidateService from '../services/candidateService.js';

import ApiError from '../utils/ApiError.js';

export const createCandidate = asyncHandler(async (req, res) => {
  const candidate = await candidateService.createCandidate(req.body);
  res.status(201).json({
    success: true,
    data: candidate,
    message: 'Candidate created successfully'
  });
});

export const getCandidates = asyncHandler(async (req, res) => {
  // If request is from an authenticated candidate, only return their own record
  if (req.user?.role === 'Candidate' && req.user.candidateId) {
    const candidate = await candidateService.getCandidateById(req.user.candidateId);
    return res.status(200).json({
      success: true,
      data: candidate ? [candidate] : [],
      message: 'Candidate profile retrieved successfully'
    });
  }

  const candidates = await candidateService.queryCandidates(req.query);
  res.status(200).json({
    success: true,
    data: candidates,
    message: 'Candidates retrieved successfully'
  });
});

export const getCandidate = asyncHandler(async (req, res) => {
  // Candidate can only access their own profile
  if (req.user?.role === 'Candidate' && req.user.candidateId && req.params.id !== req.user.candidateId) {
    throw new ApiError(403, 'Access denied: You cannot view another candidate\'s private profile.');
  }

  const candidate = await candidateService.getCandidateById(req.params.id);
  res.status(200).json({
    success: true,
    data: candidate,
    message: 'Candidate retrieved successfully'
  });
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await candidateService.updateCandidateById(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: candidate,
    message: 'Candidate updated successfully'
  });
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  await candidateService.deleteCandidateById(req.params.id);
  res.status(200).json({
    success: true,
    data: null,
    message: 'Candidate deleted successfully'
  });
});
