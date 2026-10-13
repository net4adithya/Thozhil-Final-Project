import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getInterviewById } from './interviewService.js';
import { getCandidateById } from './candidateService.js';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const mapDbToAnswer = (ans) => {
  if (!ans) return null;
  return {
    id: ans.id,
    interview: ans.interview_id,
    interviewId: ans.interview_id,
    questionId: ans.question_id_str || ans.question_id,
    questionUuid: ans.question_id,
    candidate: ans.candidate_id,
    candidateId: ans.candidate_id,
    answerText: ans.answer_text,
    transcript: ans.transcript || '',
    recordingUrl: ans.recording_url,
    duration: ans.duration,
    submittedAt: ans.submitted_at,
    evaluationStatus: ans.evaluation_status,
    score: ans.score !== null ? Number(ans.score) : null,
    feedback: ans.feedback,
    code: ans.code || '',
    language: ans.language || '',
    testCasesResult: ans.test_cases_result || [],
    compileTime: ans.compile_time !== null ? Number(ans.compile_time) : null,
    status: ans.status || '',
    timeTaken: ans.time_taken || 0,
    comments: ans.comments || '',
    createdAt: ans.created_at
  };
};

export const createAnswer = async (interviewId, answerData) => {
  // Validate interview and candidate exist
  await getInterviewById(interviewId);
  const candId = answerData.candidate || answerData.candidateId;
  if (!candId) {
    throw new ApiError(400, 'Candidate ID is required');
  }
  await getCandidateById(candId);

  // Check if questionId is a UUID
  let questionUuid = null;
  const questionIdStr = answerData.questionId ? String(answerData.questionId) : null;
  if (questionIdStr && uuidRegex.test(questionIdStr)) {
    questionUuid = questionIdStr;
  }

  const dbData = {
    interview_id: interviewId,
    candidate_id: candId,
    question_id: questionUuid,
    question_id_str: questionIdStr,
    answer_text: answerData.answerText || answerData.transcript || '',
    transcript: answerData.transcript || '',
    recording_url: answerData.recordingUrl || '',
    duration: answerData.duration || 0,
    submitted_at: answerData.submittedAt || new Date().toISOString(),
    evaluation_status: answerData.evaluationStatus || 'pending',
    score: answerData.score !== undefined ? answerData.score : null,
    feedback: answerData.feedback || '',
    code: answerData.code || '',
    language: answerData.language || '',
    test_cases_result: answerData.testCasesResult || [],
    compile_time: answerData.compileTime !== undefined ? answerData.compileTime : null,
    status: answerData.status || '',
    time_taken: answerData.timeTaken || 0,
    comments: answerData.comments || ''
  };

  const { data, error } = await supabase
    .from('answers')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return mapDbToAnswer(data);
};

export const getAnswersByInterviewId = async (interviewId) => {
  await getInterviewById(interviewId);

  const { data, error } = await supabase
    .from('answers')
    .select()
    .eq('interview_id', interviewId);

  if (error) throw error;
  return data.map(mapDbToAnswer);
};
