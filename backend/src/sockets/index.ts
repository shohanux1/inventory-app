import { Server, Socket } from 'socket.io';
import { inventoryHandlers } from './inventory';
import { salesHandlers } from './sales';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // POS-specific real-time handlers
    inventoryHandlers(socket, io);
    salesHandlers(socket, io);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}