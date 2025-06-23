import { Router } from 'express';
import authRoutes from './auth.routes';
import accountsRoutes from './accounts.routes';
import transactionsRoutes from './transactions.routes';
import categoriesRoutes from './categories.routes';
import debtsRoutes from './debts.routes';
import exchangeRateRoutes from './exchangeRate.routes';
import syncRoutes from './sync.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CashCraft API',
    version: '1.0.0'
  });
});

// API версия и статус
router.get('/', (req, res) => {
  res.json({
    message: 'CashCraft API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      accounts: '/api/v1/accounts',
      transactions: '/api/v1/transactions',
      categories: '/api/v1/categories',
      debts: '/api/v1/debts',
      sync: '/api/v1/sync',
    }
  });
});

// Подключаем роуты
router.use('/auth', authRoutes);
router.use('/accounts', accountsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/debts', debtsRoutes);
router.use('/exchange-rates', exchangeRateRoutes);
router.use('/sync', syncRoutes);

export default router;

