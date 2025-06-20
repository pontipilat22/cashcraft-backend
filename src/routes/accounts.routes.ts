import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as accountsController from '../controllers/accounts.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Получение всех счетов
router.get('/', accountsController.getAccounts);

// Создание счета
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Account name is required'),
    body('type').isIn(['cash', 'card', 'bank', 'savings', 'debt', 'credit']).withMessage('Invalid account type'),
    body('balance').optional().isNumeric(),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('cardNumber').optional().trim(),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i),
    body('icon').optional().trim(),
    body('isDefault').optional().isBoolean(),
    body('isIncludedInTotal').optional().isBoolean(),
    body('targetAmount').optional().isNumeric(),
    body('creditStartDate').optional().isISO8601(),
    body('creditTerm').optional().isInt({ min: 1 }),
    body('creditRate').optional().isFloat({ min: 0, max: 100 }),
    body('creditPaymentType').optional().isIn(['annuity', 'differentiated']),
    body('creditInitialAmount').optional().isFloat({ min: 0 }),
  ],
  validate,
  accountsController.createAccount
);

// Обновление счета
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['cash', 'card', 'bank', 'savings', 'debt', 'credit']),
    body('balance').optional().isNumeric(),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('cardNumber').optional().trim(),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i),
    body('icon').optional().trim(),
    body('isDefault').optional().isBoolean(),
    body('isIncludedInTotal').optional().isBoolean(),
    body('targetAmount').optional().isNumeric(),
    body('creditStartDate').optional().isISO8601(),
    body('creditTerm').optional().isInt({ min: 1 }),
    body('creditRate').optional().isFloat({ min: 0, max: 100 }),
    body('creditPaymentType').optional().isIn(['annuity', 'differentiated']),
    body('creditInitialAmount').optional().isFloat({ min: 0 }),
  ],
  validate,
  accountsController.updateAccount
);

// Удаление счета
router.delete(
  '/:id',
  [
    param('id').isUUID(),
  ],
  validate,
  accountsController.deleteAccount
);

// Получение статистики по счету
router.get(
  '/:id/stats',
  [
    param('id').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  accountsController.getAccountStats
);


export default router;
