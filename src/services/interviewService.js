import { mockApi } from './mockApi';

export const interviewService = {
  getInterviews: () => mockApi.getInterviews(),
  getInterviewById: (id) => mockApi.getInterviewById(id),
  createInterview: (data) => mockApi.createInterview(data),
  updateInterviewStatus: (id, status) => mockApi.updateInterviewStatus(id, status),
  deleteInterview: (id) => mockApi.deleteInterview(id),
  getTemplates: () => mockApi.getTemplates(),
  getTemplateById: (id) => mockApi.getTemplateById(id),
  createTemplate: (data) => mockApi.createTemplate(data),
  getSettings: () => mockApi.getSettings(),
  updateSettings: (data) => mockApi.updateSettings(data),
  addQuestion: (data) => mockApi.addQuestion(data),
};
