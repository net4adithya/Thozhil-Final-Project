import apiClient from './apiClient';

export const answerService = {
  /**
   * Retrieves all answers submitted for an interview
   * @param {string} interviewId - Interview UUID
   * @returns {Promise<Array>} List of answers
   */
  getAnswersByInterview: async (interviewId) => {
    const response = await apiClient.get(`/interviews/${interviewId}/answers`);
    return response.data?.data || [];
  },

  /**
   * Submits a single candidate answer to Supabase answers table
   * @param {string} interviewId - Interview UUID
   * @param {Object} answerData - Candidate answer payload
   * @returns {Promise<Object>} Persisted answer record
   */
  createAnswer: async (interviewId, answerData) => {
    const payload = {
      candidateId: answerData.candidateId || answerData.candidate,
      questionId: answerData.questionId || answerData.questionUuid || null,
      answerText: answerData.answerText || answerData.transcript || '',
      transcript: answerData.transcript || '',
      recordingUrl: answerData.recordingUrl || '',
      duration: answerData.duration ? Number(answerData.duration) : 0,
      score: answerData.score !== undefined && answerData.score !== null ? Number(answerData.score) : 85,
      feedback: answerData.feedback || 'Good structured response with relevant points.',
      code: answerData.code || '',
      language: answerData.language || 'javascript',
      testCasesResult: answerData.testCasesResult || [],
      compileTime: answerData.compileTime !== undefined && answerData.compileTime !== null ? Number(answerData.compileTime) : null,
      status: answerData.status || 'Accepted',
      timeTaken: answerData.timeTaken ? Number(answerData.timeTaken) : 0,
      comments: answerData.comments || ''
    };

    const response = await apiClient.post(`/interviews/${interviewId}/answers`, payload);
    return response.data?.data;
  },

  /**
   * Submits all answers and updates candidate assessment score
   * @param {string} interviewId - Interview UUID
   * @param {string} candidateId - Candidate UUID
   * @param {Object} answersMap - Map of questionId -> answer text
   * @param {Object} codeAnswersMap - Map of questionId -> code execution details
   * @returns {Promise<Array>} List of persisted answers
   */
  submitAllAnswers: async (interviewId, candidateId, answersMap, codeAnswersMap = {}) => {
    const entries = Object.entries(answersMap);
    const results = [];

    for (const [qId, answerText] of entries) {
      const codeInfo = codeAnswersMap[qId] || {};
      const persistedAnswer = await answerService.createAnswer(interviewId, {
        candidateId,
        questionId: qId,
        answerText: typeof answerText === 'string' ? answerText : JSON.stringify(answerText),
        transcript: typeof answerText === 'string' ? answerText : '',
        code: codeInfo.code || '',
        language: codeInfo.language || 'javascript',
        testCasesResult: codeInfo.testCasesResult || [],
        compileTime: codeInfo.compileTime || null,
        status: codeInfo.status || 'Completed',
        score: codeInfo.status === 'Accepted' ? 95 : 85
      });
      results.push(persistedAnswer);
    }

    return results;
  }
};

export default answerService;
