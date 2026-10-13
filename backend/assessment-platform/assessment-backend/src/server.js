const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const { initSocket } = require('./realtime/socket');
const { startRecordingCleanupJob } = require('./jobs/recordingCleanup');

async function start() {
  await connectDB();

  // Express app is wrapped in a plain http.Server (instead of app.listen directly) so
  // Socket.IO can attach to the same port for live candidate-progress push.
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  startRecordingCleanupJob();

  httpServer.listen(env.port, () => {
    console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
