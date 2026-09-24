import apiClient from './apiClient';
import answerService from './answerService';

export const candidateService = {
  // Fetch all candidates from Express REST API -> Supabase
  getCandidates: async () => {
    const response = await apiClient.get('/candidates');
    return response.data?.data || [];
  },

  // Fetch candidates filtered by interview ID
  getCandidatesByInterviewId: async (interviewId) => {
    const response = await apiClient.get('/candidates', {
      params: interviewId ? { interviewId } : {}
    });
    return response.data?.data || [];
  },

  // Fetch a single candidate by UUID
  getCandidateById: async (id) => {
    const response = await apiClient.get(`/candidates/${id}`);
    return response.data?.data;
  },

  // Create / Invite candidate via POST /api/candidates
  inviteCandidate: async (data) => {
    const response = await apiClient.post('/candidates', {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role || 'Software Engineer',
      interviewId: data.interviewId || null,
      status: data.status || 'Invited',
      skills: data.skills || [],
      education: data.education || [],
      experience: data.experience || [],
      projects: data.projects || []
    });
    return response.data?.data;
  },

  // Update candidate by UUID via PUT /api/candidates/:id
  updateCandidate: async (id, data) => {
    const response = await apiClient.put(`/candidates/${id}`, data);
    return response.data?.data;
  },

  // Delete candidate by UUID via DELETE /api/candidates/:id
  deleteCandidate: async (id) => {
    const response = await apiClient.delete(`/candidates/${id}`);
    return response.data?.data;
  },

  // Candidate answer submission via real answerService
  submitCandidateAnswers: async (interviewId, candidateId, answers, codeAnswers) => {
    return await answerService.submitAllAnswers(interviewId, candidateId, answers, codeAnswers);
  }
};

export default candidateService;
