import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
}

export const verifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  // 1. Check if token exists in cookies
  const token = req.cookies?.jwt;

  if (!token) {
    throw new ApiError(401, 'Unauthorized request: No token provided');
  }

  try {
    // 2. Verify token
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing');
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // 3. Verify user still exists in database
    const user = await db.orm.public.User.where({ id: decodedToken.id }).first();

    if (!user) {
      throw new ApiError(401, 'Invalid Token: User does not exist');
    }

    // 4. Attach user id to request object for next controllers to use
    req.user = { id: user.id };
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    throw new ApiError(401, 'Invalid or expired access token');
  }
});
