import axios from 'axios';

const client = axios.create({ baseURL: '/api/exam' });

export default {
  logViolation(token, { type, meta }) {
    return client.post(`/${token}/violations`, { type, meta }).then((r) => r.data);
  },
  uploadRecording(token, { type, blob, startedAt, endedAt }) {
    const form = new FormData();
    form.append('type', type);
    form.append('startedAt', startedAt);
    form.append('endedAt', endedAt);
    form.append('file', blob, `${type}-${Date.now()}.webm`);
    return client.post(`/${token}/recordings`, form).then((r) => r.data);
  },
  recordingHeartbeat(token, { webcamActive, screenActive }) {
    return client.post(`/${token}/recording-heartbeat`, { webcamActive, screenActive }).then((r) => r.data);
  },
};
