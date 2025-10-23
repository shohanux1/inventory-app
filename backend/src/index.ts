import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './sockets';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { customersRouter } from './routes/customers';
import { salesRouter } from './routes/sales';
import { inventoryRouter } from './routes/inventory';
import { profilesRouter } from './routes/profiles';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8081',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8081',
  credentials: true
}));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'POS Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/signup, /auth/signin',
      products: '/rest/v1/products',
      customers: '/rest/v1/customers',
      sales: '/rest/v1/sales',
      inventory: '/rest/v1/inventory',
      profiles: '/rest/v1/profiles'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - Mirroring Supabase structure
app.use('/auth', authRouter);
app.use('/rest/v1/products', productsRouter);
app.use('/rest/v1/customers', customersRouter);
app.use('/rest/v1/sales', salesRouter);
app.use('/rest/v1/inventory', inventoryRouter);
app.use('/rest/v1/profiles', profilesRouter);

// Socket.io handlers for real-time features
setupSocketHandlers(io);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready for real-time connections`);
});