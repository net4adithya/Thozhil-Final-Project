import apiClient from './apiClient';
import { mockApi } from './mockApi';

export const interviewService = {
  // Fetch all assessment tracks from Express REST API -> Supabase
  getInterviews: async () => {
    const response = await apiClient.get('/interviews');
    return response.data?.data || [];
  },

  // Fetch single assessment track by UUID
  getInterviewById: async (id) => {
    const response = await apiClient.get(`/interviews/${id}`);
    return response.data?.data;
  },

  // Create assessment track via POST /api/interviews
  createInterview: async (data) => {
    const payload = {
      title: data.title,
      type: data.type || data.interviewType || 'async',
      interviewType: data.interviewType || data.type || 'async',
      department: data.department || 'Engineering',
      jobRole: data.jobRole || data.title || '',
      duration: data.duration ? Number(data.duration) : 30,
      status: data.status || 'Active',
      company: data.company || '',
      job: data.job || data.jobId || null,
      candidate: data.candidate || data.candidateId || null,
      templateId: data.templateId || null,
      questions: (data.questions || []).map((q, idx) => ({
        id: q.id || null,
        text: q.text,
        category: q.category || 'General',
        difficulty: q.difficulty || 'Medium',
        type: q.type || q.questionType || 'text',
        duration: q.duration ? Number(q.duration) : 180,
        timeLimit: q.timeLimit ? Number(q.timeLimit) : (q.duration ? Number(q.duration) : 180),
        boilerplate: q.boilerplate || '',
        testCases: q.testCases || [],
        questionOrder: idx
      })),
      settings: {
        ...(data.settings || {}),
        proctorTabSwitch: data.proctorTabSwitch ?? true,
        proctorBlockCopyPaste: data.proctorBlockCopyPaste ?? true,
        proctorScreenShare: data.proctorScreenShare ?? true,
        voiceGuide: data.voiceGuide ?? true,
        department: data.department || 'Engineering',
        templateId: data.templateId || null,
        assessmentType: data.assessmentType || 'Hybrid (Video + Coding Sandbox)'
      }
    };

    const response = await apiClient.post('/interviews', payload);
    return response.data?.data;
  },

  // Update interview status via PUT /api/interviews/:id
  updateInterviewStatus: async (id, status) => {
    const response = await apiClient.put(`/interviews/${id}`, { status });
    return response.data?.data;
  },

  // Update interview via PUT /api/interviews/:id
  updateInterview: async (id, data) => {
    const response = await apiClient.put(`/interviews/${id}`, data);
    return response.data?.data;
  },

  // Delete interview via DELETE /api/interviews/:id
  deleteInterview: async (id) => {
    const response = await apiClient.delete(`/interviews/${id}`);
    return response.data?.data;
  },

  // Question endpoints
  getQuestionsByInterview: async (interviewId) => {
    const response = await apiClient.get(`/interviews/${interviewId}/questions`);
    return response.data?.data || [];
  },

  createQuestion: async (interviewId, questionData) => {
    const response = await apiClient.post(`/interviews/${interviewId}/questions`, questionData);
    return response.data?.data;
  },

  // Live AI Interview Orchestration
  initLiveSession: async (interviewId, candidateId) => {
    const response = await apiClient.post(`/interviews/${interviewId}/live/init`, { candidateId });
    return response.data?.data;
  },

  processLiveTurn: async (interviewId, turnPayload) => {
    const response = await apiClient.post(`/interviews/${interviewId}/live/turn`, turnPayload);
    return response.data?.data;
  },

  completeLiveSession: async (interviewId, candidateId) => {
    const response = await apiClient.post(`/interviews/${interviewId}/live/complete`, { candidateId });
    return response.data?.data;
  },

  // Sprint 10 Recording & Proctoring APIs
  uploadRecording: async (interviewId, formData) => {
    const response = await apiClient.post(`/interviews/${interviewId}/recordings`, formData, {
      headers: {
        'Content-Type': undefined // Let browser/Axios set boundary
      }
    });
    return response.data?.data;
  },

  getRecordings: async (interviewId) => {
    const response = await apiClient.get(`/interviews/${interviewId}/recordings`);
    return response.data?.data || [];
  },

  logProctoringEvents: async (interviewId, payload) => {
    const response = await apiClient.post(`/interviews/${interviewId}/proctoring-events`, payload);
    return response.data?.data;
  },

  getProctoringEvents: async (interviewId) => {
    const response = await apiClient.get(`/interviews/${interviewId}/proctoring-events`);
    return response.data?.data;
  },

  // Templates, settings, question bank preserved in mockApi for subsequent sprints
  getTemplates: () => mockApi.getTemplates(),
  getTemplateById: (id) => mockApi.getTemplateById(id),
  createTemplate: (data) => mockApi.createTemplate(data),
  getSettings: () => mockApi.getSettings(),
  updateSettings: (data) => mockApi.updateSettings(data),
  addQuestion: (data) => mockApi.addQuestion(data),
};

export default interviewService;
