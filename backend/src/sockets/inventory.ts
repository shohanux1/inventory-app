import { Socket, Server } from 'socket.io';

export function inventoryHandlers(socket: Socket, io: Server) {
  // Real-time inventory update when stock changes
  socket.on('inventory:update', async (data: {
    productId: string;
    quantity: number;
    type: 'sale' | 'restock' | 'adjustment';
  }) => {
    try {
      // Broadcast to all connected clients except sender
      socket.broadcast.emit('inventory:changed', {
        productId: data.productId,
        quantity: data.quantity,
        type: data.type,
        timestamp: new Date().toISOString()
      });

      // Also emit to specific room if you have multi-store setup
      io.to(`store:${socket.data.storeId}`).emit('inventory:changed', data);
    } catch (error) {
      socket.emit('error', { message: 'Failed to update inventory' });
    }
  });

  // Low stock alert
  socket.on('inventory:low-stock', (data: {
    productId: string;
    productName: string;
    currentStock: number;
    minStock: number;
  }) => {
    // Notify all managers/admins
    io.emit('alert:low-stock', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Join store-specific room for multi-location support
  socket.on('join:store', (storeId: string) => {
    socket.join(`store:${storeId}`);
    socket.data.storeId = storeId;
    console.log(`Socket ${socket.id} joined store: ${storeId}`);
  });
}