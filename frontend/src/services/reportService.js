import apiClient from './apiClient';

export const reportService = {
  /**
   * Fetches report by Report UUID or Interview UUID
   * @param {string} id - Report ID or Interview ID
   * @returns {Promise<Object>} Report object
   */
  getReportById: async (id) => {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data?.data;
  },

  /**
   * Fetches report by Interview UUID
   * @param {string} interviewId - Interview UUID
   * @returns {Promise<Object>} Report object
   */
  getReportByInterviewId: async (interviewId) => {
    const response = await apiClient.get(`/reports/interview/${interviewId}`);
    return response.data?.data;
  },

  /**
   * Triggers AI evaluation for all answers submitted in an async interview
   * @param {string} interviewId - Interview UUID
   * @returns {Promise<Object>} Generated Report object
   */
  evaluateAsyncInterview: async (interviewId) => {
    const response = await apiClient.post(`/interviews/${interviewId}/evaluate`);
    return response.data?.data;
  },

  /**
   * Fetches system-wide recruitment analytics
   * @returns {Promise<Object>} Aggregated recruitment metrics
   */
  getAnalytics: async () => {
    try {
      const response = await apiClient.get('/reports/analytics');
      return response.data?.data;
    } catch (err) {
      console.warn('Analytics fetch error, returning fallback metrics:', err.message);
      return {
        totalInterviews: 0,
        completedInterviews: 0,
        activeCandidates: 0,
        averageScore: 0
      };
    }
  }
};

export default reportService;
