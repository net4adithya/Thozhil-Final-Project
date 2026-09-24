import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { initLiveWebSocket } from './realtime/liveWebSocketGateway.js';

let server;

// Start server and bind port listener with WebSocket gateway
const startServer = async () => {
  const httpServer = http.createServer(app);
  
  // Attach Live Interview WebSocket gateway
  initLiveWebSocket(httpServer);

  server = httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running in [${config.env}] mode on port: ${config.port}`);
    console.log(`Live WebSocket gateway ready on: ws://localhost:${config.port}/ws/live`);
  });
};

// Graceful shut down coordinator
const gracefulShutdown = async (signal) => {
  console.log(`Received signal: ${signal}. Commencing graceful exit.`);
  
  if (server) {
    server.close(async () => {
      console.log('HTTP server and WebSocket listeners closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Listeners for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled Rejection:', err?.stack || err?.message || err);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err?.stack || err?.message || err);
});

startServer();
