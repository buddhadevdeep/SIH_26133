import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ENV } from '../config/env';

let ioInstance: SocketIOServer | null = null;
let activeConnectionsCount = 0;

export function initializeSockets(server: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  ioInstance.on('connection', (socket: Socket) => {
    activeConnectionsCount++;
    console.log(`[Socket.IO] Client connected: ${socket.id}. Active sockets: ${activeConnectionsCount}`);

    socket.on('disconnect', () => {
      activeConnectionsCount = Math.max(0, activeConnectionsCount - 1);
      console.log(`[Socket.IO] Client disconnected: ${socket.id}. Active sockets: ${activeConnectionsCount}`);
    });

    socket.on('queue:subscribe', (facilityId: string) => {
      socket.join(`facility:${facilityId}`);
    });

    socket.on('token:called', (data: any) => {
      socket.broadcast.emit('token:called', data);
    });
  });

  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function getOpenSocketConnections(): number {
  return activeConnectionsCount;
}

export function broadcastTokenCalled(token: any): void {
  if (ioInstance) {
    ioInstance.emit('token:called', token);
    if (token.facilityId) {
      ioInstance.to(`facility:${token.facilityId}`).emit('queue:updated', token);
    }
  }
}

export function broadcastQueueUpdate(facilityId: string, queueState: any): void {
  if (ioInstance) {
    ioInstance.emit('queue:updated', queueState);
    ioInstance.to(`facility:${facilityId}`).emit('queue:updated', queueState);
  }
}
