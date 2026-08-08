import { mockApi } from './mockApi';

export const candidateService = {
  getCandidates: () => mockApi.getCandidates(),
  getCandidatesByInterviewId: (interviewId) => mockApi.getCandidatesByInterviewId(interviewId),
  getCandidateById: (id) => mockApi.getCandidateById(id),
  inviteCandidate: (data) => mockApi.inviteCandidate(data),
  submitCandidateAnswers: (candidateId, answers, codeAnswers) =>
    mockApi.submitCandidateInterviewAnswers(candidateId, answers, codeAnswers)
};
