import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ITokenPayload } from '../types/auth';
import { UnauthorizedError } from '../utils/errors';

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <access_token>
 * On success, attaches req.user = { id, email }.
 */
export const authMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next(new UnauthorizedError('Server misconfiguration: JWT_SECRET not set'));
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as ITokenPayload;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
