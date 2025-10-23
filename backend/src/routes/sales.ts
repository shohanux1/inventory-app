import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all sales
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { user_id: req.user!.id },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ data: sales, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Create sale (with inventory update)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { items, ...saleData } = req.body;

    // Create sale with items in transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          ...saleData,
          user_id: req.user!.id
        }
      });

      // Create sale items and update inventory
      for (const item of items) {
        // Create sale item
        await tx.saleItem.create({
          data: {
            sale_id: newSale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          }
        });

        // Update inventory
        await tx.inventory.update({
          where: {
            product_id_user_id: {
              product_id: item.product_id,
              user_id: req.user!.id
            }
          },
          data: {
            quantity: { decrement: item.quantity }
          }
        });
      }

      // Update customer stats if applicable
      if (saleData.customer_id && saleData.customer_id !== 'walk-in') {
        await tx.customer.update({
          where: { id: saleData.customer_id },
          data: {
            total_purchases: { increment: 1 },
            total_spent: { increment: saleData.total },
            loyalty_points: { increment: Math.floor(saleData.total) }
          }
        });
      }

      return newSale;
    });

    res.json({ data: sale, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Get sale by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      }
    });

    res.json({ data: sale, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

export const salesRouter = router;