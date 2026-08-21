import * as questionService from '../services/questionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createQuestion = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const question = await questionService.createQuestion(interviewId, req.body);
  res.status(201).json({
    success: true,
    data: question,
    message: 'Question created successfully'
  });
});

export const getQuestions = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const questions = await questionService.getQuestionsByInterviewId(interviewId);
  res.status(200).json({
    success: true,
    data: questions,
    message: 'Questions retrieved successfully'
  });
});
