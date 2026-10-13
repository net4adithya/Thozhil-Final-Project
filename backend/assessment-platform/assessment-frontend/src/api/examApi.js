import axios from 'axios';

const client = axios.create({ baseURL: '/api/exam' });

export default {
  verifyEmail(token, email) {
    return client.post(`/${token}/verify-email`, { email }).then((r) => r.data);
  },
  getExam(token) {
    return client.get(`/${token}`).then((r) => r.data);
  },
  runCode(token, { questionId, code, language, version }) {
    return client.post(`/${token}/run`, { questionId, code, language, version }).then((r) => r.data);
  },
  saveAnswer(token, payload) {
    return client.post(`/${token}/answers`, payload).then((r) => r.data);
  },
  submitExam(token) {
    return client.post(`/${token}/submit`).then((r) => r.data);
  },
  uploadAnswerFile(token, { questionId, file }) {
    const form = new FormData();
    form.append('questionId', questionId);
    form.append('file', file);
    return client.post(`/${token}/upload`, form).then((r) => r.data);
  },
};
