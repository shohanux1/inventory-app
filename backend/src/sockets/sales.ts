import { Socket, Server } from 'socket.io';

export function salesHandlers(socket: Socket, io: Server) {
  // New sale notification
  socket.on('sale:new', (saleData: {
    id: string;
    total: number;
    items: Array<{ productId: string; quantity: number; price: number }>;
    customerId?: string;
    cashierId: string;
  }) => {
    // Broadcast to all terminals for real-time dashboard
    io.emit('sale:created', {
      ...saleData,
      timestamp: new Date().toISOString()
    });

    // Update inventory in real-time
    saleData.items.forEach(item => {
      io.emit('inventory:sold', {
        productId: item.productId,
        quantity: item.quantity
      });
    });
  });

  // Order status updates (for restaurant/cafe POS)
  socket.on('order:status', (data: {
    orderId: string;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
  }) => {
    io.emit('order:updated', data);
  });

  // Real-time sales metrics
  socket.on('metrics:request', async () => {
    // In production, this would fetch from database
    const metrics = {
      todaySales: 0,
      todayTransactions: 0,
      averageTicket: 0,
      topProducts: []
    };
    
    socket.emit('metrics:update', metrics);
  });
}