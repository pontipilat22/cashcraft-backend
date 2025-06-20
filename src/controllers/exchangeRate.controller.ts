import { Request, Response } from 'express';
import { ExchangeRateService } from '../services/exchangeRate.service';
import ExchangeRate from '../models/ExchangeRate';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

/**
 * Получить курс валюты
 */
export const getExchangeRate = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    console.log('getExchangeRate called with:', { from, to });
    
    if (!from || !to) {
      return errorResponse(res, 'Both from and to currencies are required', 400);
    }
    
    const rate = await ExchangeRateService.getExchangeRate(
      from as string, 
      to as string
    );
    
    console.log('Exchange rate result:', rate);
    
    if (rate === null) {
      return errorResponse(res, 'Exchange rate not found', 404);
    }
    
    return successResponse(res, { rate, from, to }, 200);
  } catch (error: any) {
    console.error('Exchange rate controller error:', error);
    return errorResponse(res, error.message || 'Failed to fetch exchange rate', 500);
  }
};

// Получение времени последнего обновления курсов
export const getLastUpdate = async (req: Request, res: Response) => {
  try {
    // Теперь курсы хранятся у пользователей, возвращаем текущее время
    return successResponse(res, { lastUpdate: new Date() }, 200);
  } catch (error: any) {
    console.error('Get last update error:', error);
    return errorResponse(res, 'Failed to get last update time', 500);
  }
};

// Принудительное обновление курсов из внешнего API
export const updateRates = async (req: Request, res: Response) => {
  try {
    // Проверяем, нужно ли обновить
    const needsUpdate = await ExchangeRateService.needsUpdate();
    
    if (!needsUpdate) {
      return successResponse(res, { 
        message: 'Currency rates are already up to date',
        lastUpdate: new Date()
      }, 200);
    }
    
    // Выполняем обновление
    await ExchangeRateService.updateRatesCache();
    
    return successResponse(res, { 
      message: 'Currency rates updated successfully',
      lastUpdate: new Date()
    }, 200);
  } catch (error: any) {
    console.error('Update rates error:', error);
    return errorResponse(res, 'Failed to update exchange rates', 500);
  }
};

// Получение всех курсов пользователя
export const getUserExchangeRates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const rates = await ExchangeRate.findAll({
      where: { user_id: userId },
      order: [['from_currency', 'ASC'], ['to_currency', 'ASC']],
    });
    
    return successResponse(res, { rates }, 200);
  } catch (error: any) {
    console.error('Get user exchange rates error:', error);
    return errorResponse(res, 'Failed to fetch user exchange rates', 500);
  }
};

// Сохранение или обновление курса пользователя
export const saveUserExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { from_currency, to_currency, rate, mode = 'manual' } = req.body;
    
    if (!from_currency || !to_currency || !rate) {
      return errorResponse(res, 'Missing required fields', 400);
    }
    
    if (from_currency === to_currency) {
      return errorResponse(res, 'Cannot set rate for same currency', 400);
    }
    
    if (rate <= 0) {
      return errorResponse(res, 'Rate must be positive', 400);
    }
    
    // Используем upsert для создания или обновления
    const [exchangeRate, created] = await ExchangeRate.upsert({
      user_id: userId,
      from_currency,
      to_currency,
      rate,
      mode,
    }, {
      returning: true,
    });
    
    return successResponse(
      res, 
      { 
        exchangeRate, 
        message: created ? 'Exchange rate created' : 'Exchange rate updated' 
      },
      200
    );
  } catch (error: any) {
    console.error('Save user exchange rate error:', error);
    return errorResponse(res, 'Failed to save exchange rate', 500);
  }
};

// Удаление курса пользователя
export const deleteUserExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { from_currency, to_currency } = req.params;
    
    const deleted = await ExchangeRate.destroy({
      where: {
        user_id: userId,
        from_currency,
        to_currency,
      },
    });
    
    if (deleted === 0) {
      return errorResponse(res, 'Exchange rate not found', 404);
    }
    
    return successResponse(res, { message: 'Exchange rate deleted successfully' }, 200);
  } catch (error: any) {
    console.error('Delete user exchange rate error:', error);
    return errorResponse(res, 'Failed to delete exchange rate', 500);
  }
};

// Установка режима курсов (auto/manual)
export const setExchangeRateMode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { mode } = req.body;
    
    if (!mode || !['auto', 'manual'].includes(mode)) {
      return errorResponse(res, 'Invalid mode. Must be "auto" or "manual"', 400);
    }
    
    // Обновляем все курсы пользователя
    await ExchangeRate.update(
      { mode },
      { where: { user_id: userId } }
    );
    
    return successResponse(res, { mode, message: 'Exchange rate mode updated' }, 200);
  } catch (error: any) {
    console.error('Set exchange rate mode error:', error);
    return errorResponse(res, 'Failed to set exchange rate mode', 500);
  }
};
