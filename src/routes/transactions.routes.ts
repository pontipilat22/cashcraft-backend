import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as transactionsController from '../controllers/transactions.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Получение транзакций с фильтрацией
router.get(
  '/',
  [
    query('accountId').optional().isUUID(),
    query('categoryId').optional().isUUID(),
    query('type').optional().isIn(['income', 'expense', 'transfer']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  transactionsController.getTransactions
);

// Создание транзакции
router.post(
  '/',
  [
    body('accountId').isUUID().withMessage('Valid account ID is required'),
    body('categoryId').optional({ nullable: true }).isUUID(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('type').isIn(['income', 'expense', 'transfer']).withMessage('Invalid transaction type'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('description').optional().trim(),
    body('toAccountId').optional().isUUID(),
  ],
  validate,
  transactionsController.createTransaction
);

// Обновление транзакции
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('accountId').optional().isUUID(),
    body('categoryId').optional({ nullable: true }).isUUID(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('type').optional().isIn(['income', 'expense', 'transfer']),
    body('date').optional().isISO8601(),
    body('description').optional().trim(),
    body('toAccountId').optional().isUUID(),
  ],
  validate,
  transactionsController.updateTransaction
);

// Удаление транзакции
router.delete(
  '/:id',
  [
    param('id').isUUID(),
  ],
  validate,
  transactionsController.deleteTransaction
);

// Получение статистики транзакций
router.get(
  '/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['category', 'account', 'type']),
  ],
  validate,
  transactionsController.getTransactionStats
);


export default router;
