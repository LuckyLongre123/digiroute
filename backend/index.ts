import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { db } from './src/prisma/db.js';
import { initSocket } from './src/sockets/index.js';
import logger from './src/utils/logger.js';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

const requiredEnvVars: string[] = ['PORT', 'DATABASE_URL'];

function verifyEnv(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error({ missing }, 'Missing required environment variables');
    process.exit(1);
  }
}

async function verifyDatabase(): Promise<void> {
  try {
    // Ek dummy lightweight query DB ko ping karne ke liye
    await db.orm.public.User.where({ id: 'ping-check' }).first();
    logger.info('✅ PostgreSQL (Neon) Database connected and verified');
  } catch (error) {
    logger.fatal({ error }, '❌ Database connection failed on startup');
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  verifyEnv();

  await verifyDatabase();

  // Wrap Express app with Node's native HTTP server
  const httpServer = createServer(app);

  // Initialize pure Socket.io engine
  initSocket(httpServer);

  // Use httpServer.listen instead of app.listen
  const server = httpServer.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 HTTP & Socket Server started');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    server.close(() => {
      logger.info('Server closed gracefully');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

startServer();
