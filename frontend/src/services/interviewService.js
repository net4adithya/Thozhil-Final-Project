import apiClient from './apiClient';
import { ASSESSMENT_TEMPLATES, getTemplateById as findTemplateById } from '../config/templates';

const DEFAULT_SETTINGS = {
  companyName: 'InterviewX AI Enterprise',
  recruiterName: 'Recruiter Admin',
  recruiterEmail: 'recruiter@interviewx.local',
  apiKey: 'ix_live_sec_prod_9941a80c98f8430a',
  cameraSelected: 'default-cam',
  micSelected: 'default-mic'
};

export const interviewService = {
  // Fetch assessment tracks from Express REST API -> Supabase (optionally filtered by candidateId, status, etc.)
  getInterviews: async (params = {}) => {
    const response = await apiClient.get('/interviews', { params });
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
        'Content-Type': undefined
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

  // Templates
  getTemplates: async () => {
    return ASSESSMENT_TEMPLATES;
  },

  getTemplateById: async (id) => {
    return findTemplateById(id);
  },

  createTemplate: async (data) => {
    const newTpl = {
      ...data,
      id: `tpl-${Date.now()}`
    };
    return newTpl;
  },

  // Workspace Settings
  getSettings: async () => {
    try {
      const stored = localStorage.getItem('interviewx_workspace_settings');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  updateSettings: async (data) => {
    try {
      const current = await interviewService.getSettings();
      const merged = { ...current, ...data };
      localStorage.setItem('interviewx_workspace_settings', JSON.stringify(merged));
      return merged;
    } catch {
      return data;
    }
  },

  addQuestion: async (interviewId, data) => {
    if (!interviewId) throw new Error('Interview ID required');
    const response = await apiClient.post(`/interviews/${interviewId}/questions`, data);
    return response.data?.data;
  }
};

export default interviewService;
