import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers to catch errors and forward to error middleware
 * @param fn The async function to be wrapped
 * @returns An express middleware function that handles async errors
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
