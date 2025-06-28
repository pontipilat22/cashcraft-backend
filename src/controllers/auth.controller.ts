import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, RefreshToken, Account, Category, Transaction, Debt, ExchangeRate } from '../models';
import config from '../config/config';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Генерация токенов
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId }, 
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' }, 
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

// Инициализация данных пользователя
const initializeUserData = async (userId: string): Promise<void> => {
  // Проверяем, есть ли у пользователя уже какие-либо данные
  const existingAccounts = await Account.count({ where: { user_id: userId } });
  const existingCategories = await Category.count({ where: { user_id: userId } });
  
  // Если у пользователя уже есть данные, не создаем дефолтные
  if (existingAccounts > 0 || existingCategories > 0) {
    console.log(`[initializeUserData] User ${userId} already has data (${existingAccounts} accounts, ${existingCategories} categories), skipping default creation`);
    return;
  }

  console.log(`[initializeUserData] Creating default data for new user: ${userId}`);

  // Создаем дефолтные категории
  const defaultCategories = [
    { name: 'Продукты', icon: '🛒', color: '#FF6B6B', type: 'expense' },
    { name: 'Транспорт', icon: '🚌', color: '#4ECDC4', type: 'expense' },
    { name: 'Развлечения', icon: '🎮', color: '#45B7D1', type: 'expense' },
    { name: 'Зарплата', icon: '💰', color: '#95E1D3', type: 'income' },
    { name: 'Подработка', icon: '💵', color: '#F38181', type: 'income' },
  ];

  for (const cat of defaultCategories) {
    await Category.create({
      user_id: userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type as 'income' | 'expense',
      is_system: true,
    });
  }

  // Создаем дефолтный счет
  await Account.create({
    user_id: userId,
    name: 'Наличные',
    type: 'cash',
    balance: 0,
    currency: 'RUB',
    icon: '💵',
    color: '#95E1D3',
    is_default: true,
    is_included_in_total: true,
  });
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

    // Создаем токены
    const { accessToken, refreshToken } = generateTokens(userId);

    // Сохраняем refresh токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 дней

    await RefreshToken.create({
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt,
    });

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
      accessToken,
      refreshToken,
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

    // Создаем токены
    const { accessToken, refreshToken } = generateTokens(userId);

    // Сохраняем refresh токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshToken.create({
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt,
    });

    res.json({
      user: {
        id: userId,
        email: user.email,
        displayName: user.display_name,
        isPremium: user.is_premium,
        isGuest: user.is_guest,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновление токена
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // Проверяем токен
    const decoded = jwt.verify(refreshToken, config.jwt.secret) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // Находим токен в базе
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken, user_id: decoded.userId },
    });

    if (!storedToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Проверяем, не истек ли токен
    if (storedToken.isExpired()) {
      await storedToken.destroy();
      res.status(401).json({ error: 'Refresh token expired' });
      return;
    }

    // Находим пользователя
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Удаляем старый токен
    await storedToken.destroy();

    const userId = user.id;

    // Создаем новые токены
    const tokens = generateTokens(userId);

    // Сохраняем новый refresh токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshToken.create({
      user_id: userId,
      token: tokens.refreshToken,
      expires_at: expiresAt,
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Выход из системы
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Удаляем refresh токен
      await RefreshToken.destroy({
        where: { token: refreshToken },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создание гостевого аккаунта
export const guestLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Генерируем уникальный email для гостя
    const guestEmail = `guest_${Date.now()}@cashcraft.local`;
    const guestPassword = Math.random().toString(36).substring(7);

    // Создаем гостевого пользователя
    const user = await User.create({
      email: guestEmail,
      password: guestPassword,
      display_name: 'Guest User',
      is_guest: true,
    });

    const userId = user.id;

    // Создаем токены
    const { accessToken, refreshToken } = generateTokens(userId);

    // Сохраняем refresh токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshToken.create({
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt,
    });

    // Создаем начальные данные
    await initializeUserData(userId);

    res.json({
      user: {
        id: userId,
        email: user.email,
        displayName: user.display_name,
        isPremium: user.is_premium,
        isGuest: user.is_guest,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Вход через Google
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, googleId } = req.body;
    console.log('Google login request:', { email, name, googleId });

    let user: User | null;
    let userId: string;

    // Проверяем, существует ли пользователь с таким Google ID
    user = await User.findOne({ where: { google_id: googleId } });

    if (user) {
      // Case 1: User found by google_id
      userId = user.id;
      await user.update({ last_login: new Date() });
    } else {
      // Проверяем, существует ли пользователь с таким email
      user = await User.findOne({ where: { email } });

      if (user) {
        // Case 2: User found by email, link to googleId
        await user.update({ google_id: googleId, last_login: new Date() });
        userId = user.id;
      } else {
        // Case 3: Create new user
        const newUser = await User.create({
          email,
          password: Math.random().toString(36).substring(7), // Случайный пароль
          display_name: name || email.split('@')[0],
          google_id: googleId,
          is_verified: true,
          last_login: new Date(), // Set last_login on creation
        });
        userId = newUser.id;
        await initializeUserData(userId);
        // Re-fetch to have a consistent instance for the response
        user = await User.findByPk(userId); 
        if(!user) {
            // This should realistically not happen
            throw new Error("Could not fetch newly created user for response.");
        }
      }
    }

    // Создаем токены
    const { accessToken, refreshToken } = generateTokens(userId);

    // Сохраняем refresh токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshToken.create({
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt,
    });

    res.json({
      user: {
        id: userId,
        email: user.email,
        displayName: user.display_name,
        isPremium: user.is_premium,
        isGuest: user.is_guest,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Сброс всех данных пользователя
export const resetUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.userId;
    if (!userId) {
      await transaction.rollback();
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log(`[ResetData] Resetting all data for user: ${userId}`);

    // 1. Удаляем все транзакции пользователя
    const deletedTransactions = await Transaction.destroy({
      where: { user_id: userId },
      transaction,
    });
    console.log(`[ResetData] Deleted ${deletedTransactions} transactions`);

    // 2. Удаляем все долги пользователя
    const deletedDebts = await Debt.destroy({
      where: { user_id: userId },
      transaction,
    });
    console.log(`[ResetData] Deleted ${deletedDebts} debts`);

    // 3. Удаляем ВСЕ категории пользователя (и системные, и пользовательские)
    const deletedCategories = await Category.destroy({
      where: { user_id: userId },
      transaction,
    });
    console.log(`[ResetData] Deleted ${deletedCategories} categories (all)`);

    // 4. Удаляем все счета пользователя
    const deletedAccounts = await Account.destroy({
      where: { user_id: userId },
      transaction,
    });
    console.log(`[ResetData] Deleted ${deletedAccounts} accounts`);

    // 5. Удаляем все пользовательские курсы валют
    const deletedExchangeRates = await ExchangeRate.destroy({
      where: { user_id: userId },
      transaction,
    });
    console.log(`[ResetData] Deleted ${deletedExchangeRates} exchange rates`);

    // 6. Удаляем все refresh токены пользователя
    const deletedRefreshTokens = await RefreshToken.destroy({
      where: { user_id: userId },
      transaction,
    });
    console.log(`[ResetData] Deleted ${deletedRefreshTokens} refresh tokens`);

    await transaction.commit();

    // 7. После сброса НЕ создаём дефолтные данные - пользователь сам решит что создавать
    console.log(`[ResetData] Data reset completed for user: ${userId}. User can now create their own accounts and categories.`);

    res.json({
      message: 'All user data reset successfully',
      deleted: {
        transactions: deletedTransactions,
        debts: deletedDebts,
        categories: deletedCategories,
        accounts: deletedAccounts,
        exchangeRates: deletedExchangeRates,
        refreshTokens: deletedRefreshTokens,
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Reset user data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Полный сброс всех пользовательских данных
export const fullResetUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.userId;
    if (!userId) {
      await transaction.rollback();
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log(`[FullReset] Deleting ALL user data for user: ${userId}`);

    const deletedTransactions = await Transaction.destroy({ where: { user_id: userId }, transaction });
    const deletedDebts = await Debt.destroy({ where: { user_id: userId }, transaction });
    const deletedCategories = await Category.destroy({ where: { user_id: userId }, transaction });
    const deletedAccounts = await Account.destroy({ where: { user_id: userId }, transaction });
    const deletedExchangeRates = await ExchangeRate.destroy({ where: { user_id: userId }, transaction });

    await transaction.commit();

    res.json({
      message: 'All user data fully deleted',
      deleted: {
        transactions: deletedTransactions,
        debts: deletedDebts,
        categories: deletedCategories,
        accounts: deletedAccounts,
        exchangeRates: deletedExchangeRates,
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Full reset user data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
