import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  isAdmin?: boolean;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Требуется авторизация' });
    return;
  }

  try {
    const token = header.slice(7);
    jwt.verify(token, config.jwtSecret);
    req.isAdmin = true;
    next();
  } catch {
    res.status(401).json({ message: 'Недействительный или истёкший токен' });
  }
}
