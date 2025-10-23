import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all inventory
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: { user_id: req.user!.id },
      include: {
        product: true
      }
    });

    res.json({ data: inventory, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Update inventory quantity
router.patch('/:productId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { quantity, type } = req.body;
    
    const inventory = await prisma.inventory.update({
      where: {
        product_id_user_id: {
          product_id: req.params.productId,
          user_id: req.user!.id
        }
      },
      data: {
        quantity: type === 'set' ? quantity : { increment: quantity },
        last_restock: type === 'restock' ? new Date() : undefined
      }
    });

    res.json({ data: inventory, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Get low stock items
router.get('/low-stock', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        user_id: req.user!.id,
        quantity: { lte: prisma.inventory.fields.reorder_point }
      },
      include: {
        product: true
      }
    });

    res.json({ data: inventory, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

export const inventoryRouter = router;