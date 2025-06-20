import { Router } from 'express';
import { body, param } from 'express-validator';
import * as debtsController from '../controllers/debts.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Получение всех долгов
router.get('/', debtsController.getDebts);

// Получение статистики по долгам
router.get('/stats', debtsController.getDebtStats);

// Создание долга
router.post(
  '/',
  [
    body('type').isIn(['owed_to_me', 'owed_by_me']).withMessage('Invalid debt type'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('isIncludedInTotal').optional().isBoolean(),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  debtsController.createDebt
);

// Обновление долга
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('type').optional().isIn(['owed_to_me', 'owed_by_me']),
    body('name').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('isIncludedInTotal').optional().isBoolean(),
    body('dueDate').optional({ nullable: true }).isISO8601(),
  ],
  validate,
  debtsController.updateDebt
);

// Погашение долга
router.post(
  '/:id/pay',
  [
    param('id').isUUID(),
    body('accountId').isUUID().withMessage('Account ID is required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('paymentDate').optional().isISO8601(),
  ],
  validate,
  debtsController.payOffDebt
);

// Удаление долга
router.delete(
  '/:id',
  [
    param('id').isUUID(),
  ],
  validate,
  debtsController.deleteDebt
);


export default router;
