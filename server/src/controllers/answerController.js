import * as answerService from '../services/answerService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createAnswer = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const answer = await answerService.createAnswer(interviewId, req.body);
  res.status(201).json({
    success: true,
    data: answer,
    message: 'Answer submitted successfully'
  });
});

export const getAnswers = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const answers = await answerService.getAnswersByInterviewId(interviewId);
  res.status(200).json({
    success: true,
    data: answers,
    message: 'Answers retrieved successfully'
  });
});
