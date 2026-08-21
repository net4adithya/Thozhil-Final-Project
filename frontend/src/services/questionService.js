import apiClient from './apiClient';

export const questionService = {
  /**
   * Retrieves all questions for a specific interview from Supabase
   * @param {string} interviewId - Interview UUID
   * @returns {Promise<Array>} List of questions
   */
  getQuestionsByInterview: async (interviewId) => {
    const response = await apiClient.get(`/interviews/${interviewId}/questions`);
    return response.data?.data || [];
  },

  /**
   * Creates a new question for an interview in Supabase
   * @param {string} interviewId - Interview UUID
   * @param {Object} questionData - Question payload
   * @returns {Promise<Object>} Created question
   */
  createQuestion: async (interviewId, questionData) => {
    const payload = {
      text: questionData.text,
      category: questionData.category || 'General',
      duration: questionData.duration ? Number(questionData.duration) : 180,
      timeLimit: questionData.timeLimit ? Number(questionData.timeLimit) : (questionData.duration ? Number(questionData.duration) : 180),
      difficulty: questionData.difficulty || 'Medium',
      boilerplate: questionData.boilerplate || '',
      testCases: questionData.testCases || [],
      questionOrder: questionData.questionOrder,
      expectedTopics: questionData.expectedTopics || [],
      type: questionData.type || questionData.questionType || 'text'
    };

    const response = await apiClient.post(`/interviews/${interviewId}/questions`, payload);
    return response.data?.data;
  }
};

export default questionService;
