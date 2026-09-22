import http from 'http';
import app from './app';
import { ENV } from './config/env';
import { connectDatabase, closeDatabase } from './config/db';
import { initializeSockets } from './sockets/socketHandler';

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);
  initializeSockets(server);

  server.listen(Number(ENV.PORT), '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`HealthConnect Backend Server Running`);
    console.log(`Port: ${ENV.PORT}`);
    console.log(`Environment: ${ENV.NODE_ENV}`);
    console.log(`API Prefix: http://localhost:${ENV.PORT}/api/v1`);
    console.log(`Database: ${ENV.MONGODB_URI}`);
    console.log(`Client URL: ${ENV.CLIENT_URL}`);
    console.log(`=================================================`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});
