import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler.js';

export function validateRequest(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const appErr: AppError = new Error(firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation failed');
        appErr.statusCode = 400;
        appErr.code = 'INVALID_REQUEST';
        appErr.details = error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
        return next(appErr);
      }
      next(error);
    }
  };
}
