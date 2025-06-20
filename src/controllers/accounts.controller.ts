import { Response } from 'express';
import { Account, Transaction } from '../models';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Получение всех счетов пользователя
export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accounts = await Account.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
    });

    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создание нового счета
export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      type,
      balance = 0,
      currency = 'RUB',
      cardNumber,
      color,
      icon,
      isDefault = false,
      isIncludedInTotal = true,
      targetAmount,
      creditStartDate,
      creditTerm,
      creditRate,
      creditPaymentType,
      creditInitialAmount,
    } = req.body;

    // Проверяем лимит счетов для бесплатных пользователей
    if (!req.user?.isPremiumActive()) {
      const accountCount = await Account.count({
        where: { user_id: req.userId },
      });

      if (accountCount >= 3) {
        res.status(403).json({ 
          error: 'Free users can have maximum 3 accounts. Upgrade to premium for unlimited accounts.' 
        });
        return;
      }
    }

    // Если это счет по умолчанию, сбрасываем флаг у других счетов
    if (isDefault) {
      await Account.update(
        { is_default: false },
        { where: { user_id: req.userId } }
      );
    }

    const account = await Account.create({
      user_id: req.userId!,
      name,
      type,
      balance,
      currency,
      card_number: cardNumber,
      color,
      icon,
      is_default: isDefault,
      is_included_in_total: isIncludedInTotal,
      target_amount: targetAmount,
      credit_start_date: creditStartDate,
      credit_term: creditTerm,
      credit_rate: creditRate,
      credit_payment_type: creditPaymentType,
      credit_initial_amount: creditInitialAmount,
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновление счета
export const updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const account = await Account.findOne({
      where: { id, user_id: req.userId },
    });

    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Если обновляем счет по умолчанию
    if (updateData.isDefault === true) {
      await Account.update(
        { is_default: false },
        { where: { user_id: req.userId, id: { [Op.ne]: id } } }
      );
    }

    await account.update(updateData);
    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удаление счета
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const account = await Account.findOne({
      where: { id, user_id: req.userId },
      transaction,
    });

    if (!account) {
      await transaction.rollback();
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Проверяем, не является ли это последним счетом
    const accountCount = await Account.count({
      where: { user_id: req.userId },
      transaction,
    });

    if (accountCount === 1) {
      await transaction.rollback();
      res.status(400).json({ error: 'Cannot delete the last account' });
      return;
    }

    // Удаляем связанные транзакции
    await Transaction.destroy({
      where: { 
        [Op.or]: [
          { account_id: id },
          { to_account_id: id }
        ]
      },
      transaction,
    });

    // Удаляем счет
    await account.destroy({ transaction });
    
    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получение статистики по счетам
export const getAccountStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accounts = await Account.findAll({
      where: { user_id: req.userId },
    });

    let totalBalance = 0;
    const balancesByCurrency: { [key: string]: number } = {};

    for (const account of accounts) {
      if (account.is_included_in_total) {
        // Добавляем к общему балансу в базовой валюте
        totalBalance += account.balance * account.exchange_rate;
        
        // Группируем по валютам
        if (!balancesByCurrency[account.currency]) {
          balancesByCurrency[account.currency] = 0;
        }
        balancesByCurrency[account.currency] += account.balance;
      }
    }

    res.json({
      totalBalance,
      balancesByCurrency,
      accountsCount: accounts.length,
    });
  } catch (error) {
    console.error('Get account stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
