import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/errorHandler';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(error.errors[0].message, 400));
      } else {
        next(error);
      }
    }
  };
}; 