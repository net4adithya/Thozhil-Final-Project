const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

let io = null;

/**
 * One Socket.IO namespace, "/admin", used exclusively for pushing candidate-progress
 * updates to the exam dashboard in real time (replacing the old page-load-only snapshot).
 * Candidates never connect here — their side stays plain HTTP.
 *
 * Auth: the admin client connects with `io('/admin', { auth: { token } })` using the same
 * JWT it already holds for REST calls. Sockets that fail to authenticate are disconnected
 * immediately rather than left half-open.
 *
 * Rooms: one room per exam, named `exam:<examId>`. The admin dashboard joins the room for
 * whichever exam it's currently viewing (`join-exam`) and leaves it on navigation
 * (`leave-exam`), so updates for exams nobody is looking at are never broadcast.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
    path: '/socket.io',
  });

  const admin = io.of('/admin');

  admin.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing authentication token.'));
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub).select('-passwordHash');
      if (!user || !user.isActive) return next(new Error('Invalid or inactive account.'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token.'));
    }
  });

  admin.on('connection', (socket) => {
    socket.on('join-exam', (examId) => {
      if (typeof examId === 'string') socket.join(`exam:${examId}`);
    });
    socket.on('leave-exam', (examId) => {
      if (typeof examId === 'string') socket.leave(`exam:${examId}`);
    });
  });

  return io;
}

/**
 * Pushes a candidate-progress event to every admin currently viewing this exam.
 * Safe to call even if Socket.IO hasn't been initialized (e.g. in tests) — becomes a no-op.
 *
 * @param {string} examId
 * @param {'status'|'violation'|'submitted'|'graded'} kind
 * @param {object} payload
 */
function emitCandidateUpdate(examId, kind, payload) {
  if (!io) return;
  io.of('/admin')
    .to(`exam:${examId}`)
    .emit('candidate-update', { examId: String(examId), kind, ...payload, at: new Date().toISOString() });
}

module.exports = { initSocket, emitCandidateUpdate };
