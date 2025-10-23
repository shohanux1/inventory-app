import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get profile
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.params.id }
    });

    res.json({ data: profile, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

// Update profile (including currency)
router.patch('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.profile.upsert({
      where: { id: req.user!.id },
      update: req.body,
      create: {
        id: req.user!.id,
        ...req.body
      }
    });

    res.json({ data: profile, error: null });
  } catch (error: any) {
    res.status(500).json({ data: null, error: error.message });
  }
});

export const profilesRouter = router;