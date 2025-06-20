import { Router } from 'express';
import { body, param } from 'express-validator';
import * as categoriesController from '../controllers/categories.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticate);

// Получение всех категорий
router.get('/', categoriesController.getCategories);

// Создание категории
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('type').isIn(['income', 'expense']).withMessage('Invalid category type'),
    body('icon').trim().notEmpty().withMessage('Icon is required'),
    body('color').matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  ],
  validate,
  categoriesController.createCategory
);

// Обновление категории
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['income', 'expense']),
    body('icon').optional().trim().notEmpty(),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  ],
  validate,
  categoriesController.updateCategory
);

// Удаление категории
router.delete(
  '/:id',
  [
    param('id').isUUID(),
  ],
  validate,
  categoriesController.deleteCategory
);

// Сброс категорий к стандартным
router.post('/reset', categoriesController.resetCategories);


export default router;
