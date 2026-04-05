import { Server as SocketServer } from 'socket.io';
import { type Server as HttpServer } from 'http';
import logger from './logger.js';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*', // In production, replace with specific frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Join specialized rooms
    socket.on('join', (data: { userId?: string, tenantId?: string }) => {
      if (data.userId) {
        socket.join(`user:${data.userId}`);
        logger.info(`Socket ${socket.id} joined user room: user:${data.userId}`);
      }
      if (data.tenantId) {
        socket.join(`tenant:${data.tenantId}`);
        logger.info(`Socket ${socket.id} joined tenant room: tenant:${data.tenantId}`);
      }
    });

    socket.on('leave', (data: { userId?: string, tenantId?: string }) => {
      if (data.userId) socket.leave(`user:${data.userId}`);
      if (data.tenantId) socket.leave(`tenant:${data.tenantId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
