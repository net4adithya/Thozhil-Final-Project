import { mockApi } from './mockApi';

export const reportService = {
  getReportByCandidateId: async (candidateId) => {
    const candidate = await mockApi.getCandidateById(candidateId);
    if (!candidate) return null;
    const interview = await mockApi.getInterviewById(candidate.interviewId);
    return { candidate, interview };
  },
  getAnalytics: () => mockApi.getAnalytics()
};
