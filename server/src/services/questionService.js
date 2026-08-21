import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getInterviewById } from './interviewService.js';

const mapDbToQuestion = (q) => {
  if (!q) return null;
  return {
    id: q.id,
    interviewId: q.interview_id,
    text: q.text,
    category: q.category,
    duration: q.duration || q.time_limit || 180,
    difficulty: q.difficulty,
    boilerplate: q.boilerplate || '',
    testCases: q.test_cases || [],
    questionOrder: q.question_order,
    expectedTopics: q.expected_topics || [],
    questionType: q.question_type || 'text',
    timeLimit: q.time_limit || q.duration
  };
};

export const createQuestion = async (interviewId, questionData) => {
  // Validate interview exists
  await getInterviewById(interviewId);

  // Get current max order
  const { data: countData, error: countError } = await supabase
    .from('questions')
    .select('question_order')
    .eq('interview_id', interviewId);

  if (countError) throw countError;

  const nextOrder = countData && countData.length > 0
    ? Math.max(...countData.map(q => q.question_order)) + 1
    : 0;

  const dbData = {
    interview_id: interviewId,
    text: questionData.text,
    category: questionData.category || 'General',
    duration: questionData.duration || questionData.timeLimit || 180,
    time_limit: questionData.timeLimit || questionData.duration || 180,
    difficulty: questionData.difficulty || 'Medium',
    boilerplate: questionData.boilerplate || '',
    test_cases: questionData.testCases || [],
    question_order: questionData.questionOrder !== undefined ? questionData.questionOrder : nextOrder,
    expected_topics: questionData.expectedTopics || [],
    question_type: questionData.questionType || 'text'
  };

  const { data, error } = await supabase
    .from('questions')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return mapDbToQuestion(data);
};

export const getQuestionsByInterviewId = async (interviewId) => {
  // Validate interview exists
  await getInterviewById(interviewId);

  const { data, error } = await supabase
    .from('questions')
    .select()
    .eq('interview_id', interviewId)
    .order('question_order', { ascending: true });

  if (error) throw error;
  return data.map(mapDbToQuestion);
};
