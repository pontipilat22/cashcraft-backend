import { Router } from 'express';

import authRoutes         from './auth.routes';
import exchangeRateRoutes from './exchangeRate.routes';

const router = Router();

/* ──────────── service / health ──────────── */
router.get('/health', (_req, res) => {
  res.json({
    status    : 'ok',
    timestamp : new Date().toISOString(),
    service   : 'CashCraft API',
    version   : '1.0.0',
  });
});

/* ──────────── API root info ──────────── */
router.get('/', (_req, res) => {
  res.json({
    message  : 'CashCraft API',
    version  : '1.0.0',
    endpoints: {
      auth         : '/api/v1/auth',
      exchangeRates: '/api/v1/exchange-rates',
    },
  });
});

/* ──────────── attach sub-routers ──────────── */
router.use('/auth',           authRoutes);
router.use('/exchange-rates', exchangeRateRoutes);

export default router;