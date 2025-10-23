import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all products
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const products = await prisma.product.findMany({
      where: {
        user_id: req.user!.id,
        status: status as string,
        deleted_at: null
      },
      include: {
        inventory: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ data: products, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Create product
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        user_id: req.user!.id
      }
    });

    // Create inventory record
    await prisma.inventory.create({
      data: {
        product_id: product.id,
        user_id: req.user!.id,
        quantity: 0
      }
    });

    res.json({ data: product, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Update product
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json({ data: product, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Soft delete product
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { 
        deleted_at: new Date(),
        status: 'inactive'
      }
    });

    res.json({ data: product, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

export const productsRouter = router;