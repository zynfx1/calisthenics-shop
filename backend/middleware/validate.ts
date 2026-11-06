import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/errors';

/**
 * Validates req.body (default) or req.query.
 * Parsed query values are placed on res.locals.query.
 */
export const validate =
  (schema: ZodSchema, source: 'body' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(source === 'body' ? req.body : req.query);
    if (!result.success) {
      return next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          'Validation failed',
          result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }
    if (source === 'body') req.body = result.data;
    else res.locals.query = result.data;
    next();
  };
