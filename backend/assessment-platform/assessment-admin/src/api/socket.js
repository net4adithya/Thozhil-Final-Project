import { io } from 'socket.io-client';
import { authState } from './client';

let socket = null;

/**
 * Lazily connects to the backend's /admin Socket.IO namespace using the same JWT
 * already used for REST calls. One shared socket for the whole admin app — views
 * join/leave the `exam:<id>` room for whichever exam they're currently viewing.
 */
export function getSocket() {
  if (socket) return socket;
  socket = io('/admin', {
    path: '/socket.io',
    auth: { token: authState.token },
    autoConnect: false,
  });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (authState.token) {
    s.auth = { token: authState.token };
    if (!s.connected) s.connect();
  }
  return s;
}

export function joinExamRoom(examId) {
  const s = connectSocket();
  s.emit('join-exam', examId);
}

export function leaveExamRoom(examId) {
  if (!socket) return;
  socket.emit('leave-exam', examId);
}
