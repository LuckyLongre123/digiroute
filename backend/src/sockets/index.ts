import type { Server as HTTPServer } from 'http';
import { Server, type Socket } from 'socket.io';
import logger from '../utils/logger.js';

let io: Server;

export const initSocket = (server: HTTPServer): void => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Industry standard: prevent idle connections from dropping immediately
    pingTimeout: 60000,
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, '🟢 New Socket client connected');

    // Global error handler to prevent server crashes from socket exceptions
    socket.on('error', (err) => {
      logger.error({ socketId: socket.id, err }, 'Socket error occurred');
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, '🔴 Socket client disconnected');
    });
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
