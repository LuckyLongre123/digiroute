import type { Request, Response } from 'express';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

  logger.info({ email, password }, 'Register attempt');

  // TODO: Check if user already exists
  // TODO: Hash password
  // TODO: Save user to database
  // TODO: Generate JWT

  res.status(201).json(new ApiResponse(201, { name, email }, 'User registered successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as LoginInput;

  logger.info({ email }, 'Login attempt');

  // TODO: Find user by email
  // TODO: Verify password
  // TODO: Generate JWT
  // TODO: Set cookie or return token

  if (!email) {
    throw new ApiError(401, 'Invalid credentials');
  }

  res
    .status(200)
    .json(new ApiResponse(200, { email, token: 'dummy-jwt-token' }, 'Login successful'));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Invalidate token / clear cookie
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});
