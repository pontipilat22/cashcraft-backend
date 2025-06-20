import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { User } from '../models';

export interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.userId = user.id;
    req.user = user;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    return;
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware для проверки premium статуса
export const requirePremium = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
}

  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

