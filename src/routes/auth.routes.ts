import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validation';

const router = Router();

// Регистрация
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('displayName').optional().trim().isLength({ min: 1 }),
  ],
  validate,
  authController.register
);

// Вход
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

// Гостевой вход
router.post('/guest', authController.guestLogin);

// Google вход
router.post(
  '/google',
  [
    body('email').isEmail().normalizeEmail(),
    body('displayName').optional().trim(),
    body('googleId').notEmpty().withMessage('Google ID is required'),
  ],
  validate,
  authController.googleLogin
);

// Сброс всех данных пользователя
router.post(
  '/reset-data',
  [],
  validate,
  authController.resetUserData
);

// Полный сброс всех пользовательских данных
router.post(
  '/reset',
  [],
  validate,
  authController.fullResetUserData
);

export default router;
