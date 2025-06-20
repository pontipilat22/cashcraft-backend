import { Request, Response, NextFunction } from 'express';
import config from '../config/config';

/**
 * Middleware для принудительного использования HTTPS в production
 */
export const forceHttps = (req: Request, res: Response, next: NextFunction): void => {
  // В production принудительно используем HTTPS
  if (config.server.nodeEnv === 'production' && !req.secure && req.get('X-Forwarded-Proto') !== 'https') {
    res.redirect(`https://${req.get('Host')}${req.url}`);
    return;
  }
  next();
};

/**
 * Middleware для добавления заголовков безопасности
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Предотвращаем кеширование чувствительных данных
  if (req.path.includes('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }

  // Добавляем заголовки безопасности
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  next();
};

/**
 * Middleware для проверки безопасности запросов
 */
export const requestSecurity = (req: Request, res: Response, next: NextFunction): void => {
  // Блокируем запросы с подозрительными символами в параметрах
  const suspiciousPattern = /<script|javascript:|onerror|onclick/gi;
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string' && value.length > 10000) {
      return false;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(checkValue);
    }
    return true;
  };
  
  // Проверяем параметры запроса
  const paramsToCheck = [req.body, req.query, req.params];
  for (const params of paramsToCheck) {
    if (params && JSON.stringify(params).match(suspiciousPattern)) {
      res.status(400).json({ error: 'Invalid request parameters' });
      return;
    }
    if (params && !checkValue(params)) {
      res.status(400).json({ error: 'Request payload too large' });
      return;
    }
  }
  
  next();
};


