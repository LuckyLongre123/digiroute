import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    // Agar custom API error hai (jaise validation), toh client ko exact details bhejo
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: err.success,
      message: err.message,
      // Agar validation errors hain, toh unhe 'data' mein bhej do
      data: err.errors.length > 0 ? err.errors : null,
    });
    return;
  }

  // Agar koi unhandled crash ya system error hai, toh usko error level par log karo
  logger.error({ err }, 'Unhandled Server Error');
  res.status(500).json(new ApiResponse(500, null, 'Internal Server Error'));
};
