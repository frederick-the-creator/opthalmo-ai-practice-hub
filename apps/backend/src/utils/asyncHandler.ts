import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Simplifies error handling for Async route handlers
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response
>(
  fn: (req: Req, res: Res) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    void (fn as (req: Req, res: Res) => Promise<unknown>)(req as Req, res as Res)
      .catch(next);
  };
}