import { Response } from 'express';

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200,
  meta?: ApiResponseMeta
) {
  const payload: {
    success: true;
    message: string;
    data: T;
    meta?: ApiResponseMeta;
  } = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors: unknown[] = []
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
