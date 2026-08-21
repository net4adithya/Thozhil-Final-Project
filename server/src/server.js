import app from './app.js';
import { config } from './config/env.js';

let server;

// Start server and bind port listener
const startServer = async () => {
  server = app.listen(config.port, () => {
    console.log(`Server running in [${config.env}] mode on port: ${config.port}`);
  });
};

// Graceful shut down coordinator
const gracefulShutdown = async (signal) => {
  console.log(`Received signal: ${signal}. Commencing graceful exit.`);
  
  if (server) {
    server.close(async () => {
      console.log('HTTP server listener closed.');
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
  console.error(`Unhandled Rejection Error: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

startServer();
