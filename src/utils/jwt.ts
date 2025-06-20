import jwt from 'jsonwebtoken';
import config from '../config/config';

export interface TokenPayload {
  userId: string;
  type?: string;
}

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId }, 
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' }, 
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): string | null => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return payload.userId;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): string | null => {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret) as any;
    return payload.userId;
  } catch (error) {
    return null;
  }
};
