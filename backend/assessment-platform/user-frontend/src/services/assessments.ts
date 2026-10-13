import api from './api';

export interface AssessmentCreateRequest {
  title: string;
  duration_minutes: number;
  total_questions?: number;
  difficulty_distribution?: Record<string, number>;
  topic_tags?: string[];
  ai_selection_enabled?: boolean;
  question_ids?: (string | number)[];
  question_bank_id?: string | number;
}

export interface AssessmentResponse {
  id: string;
  title: string;
  duration_minutes: number;
  total_questions: number;
  difficulty_distribution?: Record<string, number>;
  topic_tags?: string[];
  ai_selection_enabled?: boolean;
  status: string;
  created_at: string;
  published_at?: string;
  accessCode?: string;
  assignment_id?: string;
}

export const assessmentsService = {
  enterAccessCode: async (code: string): Promise<any> => {
    const response = await api.post('/intern/access', { code });
    if (response.data?.accessToken) {
      localStorage.setItem('candidate_token', response.data.accessToken);
    }
    return response.data;
  },

  getAssessments: async (): Promise<AssessmentResponse[]> => {
    const response = await api.get('/exams');
    return response.data.map((e: any) => ({
      id: e._id || e.id,
      title: e.title || 'Technical Assessment',
      duration_minutes: e.durationMinutes || 45,
      total_questions: Array.isArray(e.questions) ? e.questions.length : 0,
      status: e.status || 'active',
      created_at: e.createdAt || new Date().toISOString(),
      accessCode: e.accessCode,
    }));
  },

  getMyAssessment: async (): Promise<AssessmentResponse> => {
    const token = localStorage.getItem('candidate_token');
    if (!token) throw new Error('No candidate session found');
    const response = await api.get(`/exam/${token}`);
    const ex = response.data.exam;
    const qs = response.data.questions || [];
    return {
      id: ex.id || ex._id,
      title: ex.title,
      duration_minutes: ex.durationMinutes || 45,
      total_questions: qs.length,
      status: 'active',
      created_at: new Date().toISOString(),
    };
  },

  createAssessment: async (data: AssessmentCreateRequest): Promise<AssessmentResponse> => {
    const createRes = await api.post('/exams', {
      title: data.title,
      description: data.topic_tags?.join(', ') || 'Coding Assessment',
      durationMinutes: data.duration_minutes || 45,
      status: 'active',
    });
    const exam = createRes.data;
    const examId = exam._id || exam.id;

    if (data.question_ids && data.question_ids.length > 0) {
      await api.post(`/exams/${examId}/questions`, { questionIds: data.question_ids });
    }

    // Publish to generate access code
    const pubRes = await api.post(`/exams/${examId}/publish`);
    const publishedExam = pubRes.data.exam || pubRes.data;

    return {
      id: examId,
      title: publishedExam.title || data.title,
      duration_minutes: publishedExam.durationMinutes || data.duration_minutes,
      total_questions: data.question_ids?.length || 0,
      status: 'published',
      created_at: new Date().toISOString(),
      accessCode: publishedExam.accessCode || exam.accessCode,
    };
  },

  getAssessmentQuestions: async (assessmentId: string | number): Promise<any[]> => {
    const token = localStorage.getItem('candidate_token');
    if (token) {
      const response = await api.get(`/exam/${token}`);
      return response.data.questions || [];
    }
    const response = await api.get(`/exams/${assessmentId}`);
    return response.data.questions || [];
  },

  runCandidateCode: async (questionId: string, code: string, language: string): Promise<any> => {
    const token = localStorage.getItem('candidate_token');
    if (!token) throw new Error('No active candidate session token');
    const response = await api.post(`/exam/${token}/run`, { questionId, code, language });
    return response.data;
  },

  saveCandidateAnswer: async (questionId: string, code: string, language: string): Promise<any> => {
    const token = localStorage.getItem('candidate_token');
    if (!token) return;
    const response = await api.post(`/exam/${token}/answers`, { questionId, code, language });
    return response.data;
  },

  submitCandidateExam: async (): Promise<any> => {
    const token = localStorage.getItem('candidate_token');
    if (!token) throw new Error('No active candidate session token');
    const response = await api.post(`/exam/${token}/submit`);
    return response.data;
  },

  submitDecision: async (candidateId: string, decision: string, notes?: string): Promise<any> => {
    const response = await api.put(`/exams/decision`, { candidateId, decision, privateNotes: notes });
    return response.data;
  },

  getAssessment: async (id: string | number): Promise<AssessmentResponse> => {
    const response = await api.get(`/exams/${id}`);
    const e = response.data;
    return {
      id: e._id || e.id,
      title: e.title,
      duration_minutes: e.durationMinutes || 45,
      total_questions: Array.isArray(e.questions) ? e.questions.length : 0,
      status: e.status,
      created_at: e.createdAt || new Date().toISOString(),
      accessCode: e.accessCode,
    };
  },

  publishAssessment: async (id: string | number): Promise<AssessmentResponse> => {
    const response = await api.post(`/exams/${id}/publish`);
    const e = response.data.exam || response.data;
    return {
      id: e._id || e.id,
      title: e.title,
      duration_minutes: e.durationMinutes,
      total_questions: Array.isArray(e.questions) ? e.questions.length : 0,
      status: 'published',
      created_at: new Date().toISOString(),
      accessCode: e.accessCode,
    };
  },

  generateAssessment: async (id: string | number): Promise<any> => {
    const response = await api.post(`/exams/${id}/publish`);
    return response.data;
  },

  assignAssessmentByEmail: async (id: string | number, email: string): Promise<any> => {
    const response = await api.post(`/exams/${id}/invite`, { candidates: [{ email, name: email.split('@')[0] }] });
    return response.data;
  },
};
