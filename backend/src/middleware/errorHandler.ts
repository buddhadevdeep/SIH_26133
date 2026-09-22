import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Middleware]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal healthcare server error.';
  const errors = err.errors || [];

  sendError(res, message, statusCode, errors);
}
