import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));

      const firstErrorMessage = result.error.issues[0]?.message || 'Invalid input parameters';

      const mainMessage = `Validation failed: ${firstErrorMessage}`;

      logger.warn({ path: req.originalUrl, method: req.method, errors }, 'Zod Validation Failed');

      next(new ApiError(422, mainMessage, errors));
      return;
    }

    req.body = result.data;
    next();
  };
};
