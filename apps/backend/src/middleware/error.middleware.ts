import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '@/lib/httpError.js';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {

  if (err instanceof ZodError) {
      const issues = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      console.warn('[errorMiddleware] Zod validation failed', issues)
      res.status(400).json({ error: 'Invalid input', issues });
    return;
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      console.error('[errorMiddleware] HttpError', err.status, err.message);
    } else {
      console.warn('[errorMiddleware] HttpError', err.status, err.message);
    }
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof Error) {
    console.error(err);
    res.status(500).json({ error: err.message });
    return
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
}