import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        user_id: req.user!.id,
        deleted_at: null
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ data: customers, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Create customer
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.create({
      data: {
        ...req.body,
        user_id: req.user!.id
      }
    });

    res.json({ data: customer, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Update customer
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json({ data: customer, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Get single customer
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        sales: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    res.json({ data: customer, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

export const customersRouter = router;