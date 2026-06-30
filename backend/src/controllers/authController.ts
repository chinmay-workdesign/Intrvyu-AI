import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-intrvyu-ai';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function signup(req: Request, res: Response) {
  try {
    const validatedBody = signupSchema.parse(req.body);
    const { email, password, name } = validatedBody;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create default analytics record for new user
    await prisma.interviewAnalytics.create({
      data: {
        userId: user.id,
        averageScore: 0,
        timeSpent: 0,
        sessionsCount: 0,
        scoreTrends: [],
        competencies: {},
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const validatedBody = loginSchema.parse(req.body);
    const { email, password } = validatedBody;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login.' });
  }
}
