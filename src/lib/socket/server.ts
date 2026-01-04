import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export function createSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  return io;
}
