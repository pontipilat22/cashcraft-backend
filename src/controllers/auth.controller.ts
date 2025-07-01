import { Request, Response } from 'express';
import { User, ExchangeRate } from '../models';
import config from '../config/config';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Инициализация данных пользователя
const initializeUserData = async (userId: string): Promise<void> => {
  console.log(`[initializeUserData] User ${userId} created - no default data needed for local-only app`);
};

// Регистрация нового пользователя
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Создаем пользователя
    const user = await User.create({
      email,
      password,
      display_name: displayName || email.split('@')[0],
    });

    const userId = user.id;

    // Создаем начальные данные для пользователя
    await initializeUserData(userId);

    res.status(201).json({
      user: {
        id: userId,
        email: user.email,
        displayName: user.display_name,
        isPremium: user.is_premium,
        isGuest: user.is_guest,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Вход в систему
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Находим пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Проверяем пароль
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Обновляем последний вход
    await user.update({ last_login: new Date() });

    const userId = user.id;

    res.json({
      user: {
        id: userId,
        email: user.email,
        displayName: user.display_name,
        isPremium: user.is_premium,
        isGuest: user.is_guest,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Гостевой вход
export const guestLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const guestEmail = `guest_${Date.now()}@cashcraft.local`;
    const guestPassword = Math.random().toString(36).substring(2, 15);

    // Создаем гостевого пользователя
    const user = await User.create({
      email: guestEmail,
      password: guestPassword,
      display_name: 'Гость',
      is_guest: true,
    });

    const userId = user.id;

    // Создаем начальные данные для гостя
    await initializeUserData(userId);

    res.json({
      user: {
        id: userId,
        email: user.email,
        displayName: user.display_name,
        isPremium: user.is_premium,
        isGuest: user.is_guest,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Google вход (упрощенный)
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, displayName, googleId } = req.body;

    if (!email || !googleId) {
      res.status(400).json({ error: 'Email and Google ID are required' });
      return;
    }

    // Ищем существующего пользователя
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Создаем нового пользователя
      user = await User.create({
        email,
        display_name: displayName || email.split('@')[0],
        google_id: googleId,
        password: Math.random().toString(36).substring(2, 15), // случайный пароль
      });

      // Создаем начальные данные
      await initializeUserData(user.id);
    } else {
      // Обновляем Google ID если его нет
      if (!user.google_id) {
        await user.update({ google_id: googleId });
      }
      
      // Обновляем последний вход
      await user.update({ last_login: new Date() });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isPremium: user.is_premium,
        isGuest: user.is_guest,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Сброс данных пользователя
export const resetUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Проверяем существование пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Удаляем только обменные курсы пользователя
    await ExchangeRate.destroy({
      where: { user_id: userId },
    });

    res.json({ message: 'User exchange rates reset successfully' });
  } catch (error) {
    console.error('Reset user data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Полный сброс данных пользователя
export const fullResetUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Проверяем существование пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Удаляем только обменные курсы пользователя
    await ExchangeRate.destroy({
      where: { user_id: userId },
    });

    res.json({ message: 'User exchange rates fully reset successfully' });
  } catch (error) {
    console.error('Full reset user data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 