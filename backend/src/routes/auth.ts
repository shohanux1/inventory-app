import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Sign up - Supabase compatible
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user profile
    const profile = await prisma.profile.create({
      data: {
        id: email, // Using email as ID for simplicity
        business_email: email
      }
    });

    const token = jwt.sign(
      { id: profile.id, email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: profile.id, email },
      session: { access_token: token }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Sign in - Supabase compatible
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verify credentials (simplified for demo)
    const profile = await prisma.profile.findFirst({
      where: { business_email: email }
    });

    if (!profile) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: profile.id, email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: profile.id, email },
      session: { access_token: token }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get user - Supabase compatible
router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    res.json({
      data: { user: { id: decoded.id, email: decoded.email } },
      error: null
    });
  } catch (error) {
    res.status(401).json({ data: null, error: 'Invalid token' });
  }
});

export const authRouter = router;