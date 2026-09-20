import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { cookieOptions } from '../constants/index.js';
import { db } from '../prisma/db.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

// helper function: JWT Token Generator
function generateToken(userId: string): string {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in .env');

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

  logger.info({ email }, 'Register attempt initiated');

  const existingUser = await db.orm.public.User.where({ email }).first();
  if (existingUser) {
    logger.warn({ email }, 'Register failed: User already exists');
    throw new ApiError(409, 'User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await db.orm.public.User.create({
    email,
    password: hashedPassword,
    name,
  });

  const token = generateToken(user.id);
  res.cookie('jwt', token, cookieOptions);

  const userResponse = { id: user.id, name: user.name, email: user.email };

  logger.info({ userId: user.id, email }, 'New user registered successfully');
  res
    .status(201)
    .json(new ApiResponse(201, { user: userResponse }, 'User registered successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  logger.info({ email }, 'Login attempt initiated');

  const user = await db.orm.public.User.where({ email }).first();
  if (!user) {
    logger.warn({ email }, 'Login failed: User not found');
    throw new ApiError(401, 'Invalid email or password'); // Client ko generic message hi dena hai
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn({ email, userId: user.id }, 'Login failed: Incorrect password');
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user.id);
  res.cookie('jwt', token, cookieOptions);

  const userResponse = { id: user.id, name: user.name, email: user.email };

  logger.info({ userId: user.id, email }, 'User logged in successfully');
  res.status(200).json(new ApiResponse(200, { user: userResponse }, 'Login successful'));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  logger.info('Logout attempt initiated');

  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  logger.info('User logged out successfully');
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});
