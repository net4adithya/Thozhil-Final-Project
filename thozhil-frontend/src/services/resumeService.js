import apiClient from './apiClient';

export const resumeService = {
  /**
   * Uploads candidate resume via multipart/form-data to POST /api/resumes
   * @param {string} candidateId - Candidate UUID
   * @param {File} file - Resume file (PDF, DOC, DOCX, TXT max 5MB)
   * @returns {Promise<Object>} Created resume record with extracted text
   */
  uploadResume: async (candidateId, file) => {
    if (!file) {
      throw new Error('Please select a resume file to upload.');
    }

    // Client-side file extension validation
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const fileName = file.name || '';
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT file.');
    }

    // Client-side file size validation (5MB max)
    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new Error('File size exceeds the 5MB maximum limit.');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (candidateId) {
      formData.append('candidateId', candidateId);
    }

    const response = await apiClient.post('/resumes', formData);

    return response.data?.data;
  },

  /**
   * Fetches resume details by ID
   * @param {string} id - Resume UUID
   * @returns {Promise<Object>} Resume record
   */
  getResumeById: async (id) => {
    const response = await apiClient.get(`/resumes/${id}`);
    return response.data?.data;
  },

  /**
   * Triggers text extraction and processing on an existing stored resume
   * @param {string} id - Resume UUID
   * @returns {Promise<Object>} Processed resume record with parsed text
   */
  processResume: async (id) => {
    const response = await apiClient.post(`/resumes/${id}/process`);
    return response.data?.data;
  },

  /**
   * Triggers AI Resume Screening against candidate target role / job description
   * @param {string} id - Resume UUID
   * @param {string} [jobId] - Optional Job opening UUID
   * @returns {Promise<Object>} Structured screening result and updated candidate profile
   */
  screenResume: async (id, jobId = null) => {
    const payload = jobId ? { jobId } : {};
    const response = await apiClient.post(`/resumes/${id}/screen`, payload);
    return response.data?.data;
  },

  /**
   * Generates tailored technical interview questions synthesized directly from candidate's resume
   * @param {string} id - Resume UUID
   * @param {Object} [options] - Options { roleTitle, jobId }
   * @returns {Promise<Object>} Candidate profile summary and personalized questions array
   */
  generateQuestionsFromResume: async (id, options = {}) => {
    const response = await apiClient.post(`/resumes/${id}/generate-questions`, options);
    return response.data?.data;
  }
};

export default resumeService;
