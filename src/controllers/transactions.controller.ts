import { Response } from 'express';
import { Transaction, Account, Category } from '../models';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Получение транзакций пользователя с фильтрацией
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const whereClause: any = { user_id: req.userId };

    if (accountId) {
      whereClause[Op.or] = [
        { account_id: accountId },
        { to_account_id: accountId }
      ];
    }

    if (categoryId) {
      whereClause.category_id = categoryId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'name', 'type', 'currency'],
        },
        {
          model: Account,
          as: 'toAccount',
          attributes: ['id', 'name', 'type', 'currency'],
          required: false,
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color'],
          required: false,
        },
      ],
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const total = await Transaction.count({ where: whereClause });

    res.json({
      transactions,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создание новой транзакции
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  
  try {
    const {
      id,
      accountId,
      categoryId,
      amount,
      type,
      date,
      description,
      toAccountId, // Для переводов
    } = req.body;

    // Проверяем, что счет принадлежит пользователю
    const account = await Account.findOne({
      where: { id: accountId, user_id: req.userId },
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Для переводов проверяем второй счет
    if (type === 'transfer') {
      if (!toAccountId) {
        await t.rollback();
        res.status(400).json({ error: 'Target account is required for transfers' });
        return;
      }

      const toAccount = await Account.findOne({
        where: { id: toAccountId, user_id: req.userId },
        transaction: t,
      });

      if (!toAccount) {
        await t.rollback();
        res.status(404).json({ error: 'Target account not found' });
        return;
      }

      // Проверяем, что счета разные
      if (accountId === toAccountId) {
        await t.rollback();
        res.status(400).json({ error: 'Cannot transfer to the same account' });
        return;
      }
    }

    // Проверяем, существует ли уже транзакция с таким id
    if (id) {
      const existingTransaction = await Transaction.findOne({
        where: { id, user_id: req.userId },
        transaction: t,
      });

      if (existingTransaction) {
        // Обновляем существующую транзакцию
        await existingTransaction.update({
          account_id: accountId,
          category_id: categoryId,
          amount,
          type,
          date: new Date(date),
          description,
          to_account_id: toAccountId,
        }, { transaction: t });

        await t.commit();

        // Возвращаем обновленную транзакцию с включенными связями
        const updatedTransaction = await Transaction.findByPk(existingTransaction.id, {
          include: [
            { model: Account, as: 'account' },
            { model: Account, as: 'toAccount' },
            { model: Category, as: 'category' }
          ]
        });

        res.json(updatedTransaction);
        return;
      }
    }

    // Создаем транзакцию
    const transaction = await Transaction.create({
      id: id || undefined,
      user_id: req.userId!,
      account_id: accountId,
      category_id: categoryId,
      amount,
      type,
      date: new Date(date),
      description,
      to_account_id: toAccountId,
    }, { transaction: t });

    // Обновляем балансы счетов
    if (type === 'income') {
      await account.increment('balance', { by: amount, transaction: t });
    } else if (type === 'expense') {
      await account.decrement('balance', { by: amount, transaction: t });
    } else if (type === 'transfer') {
      await account.decrement('balance', { by: amount, transaction: t });
      
      const toAccount = await Account.findByPk(toAccountId, { transaction: t });
      if (toAccount) {
        await toAccount.increment('balance', { by: amount, transaction: t });
      }
    }

    await t.commit();

    // Возвращаем созданную транзакцию с включенными связями
    const createdTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Account, as: 'account' },
        { model: Account, as: 'toAccount' },
        { model: Category, as: 'category' }
      ]
    });

    res.status(201).json(createdTransaction);
  } catch (error) {
    await t.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновление транзакции
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const transaction = await Transaction.findOne({
      where: { id, user_id: req.userId },
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    await transaction.update(updateData);
    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удаление транзакции
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, user_id: req.userId },
      include: [{ model: Account, as: 'account' }],
      transaction: t,
    });

    if (!transaction) {
      await t.rollback();
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Восстанавливаем баланс счета
    const account = await Account.findByPk(transaction.account_id, { transaction: t });
    if (account) {
      if (transaction.type === 'income') {
        await account.decrement('balance', { by: transaction.amount, transaction: t });
      } else if (transaction.type === 'expense') {
        await account.increment('balance', { by: transaction.amount, transaction: t });
      } else if (transaction.type === 'transfer' && transaction.to_account_id) {
        await account.increment('balance', { by: transaction.amount, transaction: t });
        
        const toAccount = await Account.findByPk(transaction.to_account_id, { transaction: t });
        if (toAccount) {
          await toAccount.decrement('balance', { by: transaction.amount, transaction: t });
        }
      }
    }

    await transaction.destroy({ transaction: t });
    await t.commit();
    
    res.status(204).send();
  } catch (error) {
    await t.rollback();
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получение статистики по транзакциям
export const getTransactionStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = 'month' } = req.query;
    
    const transactions = await Transaction.findAll({
      where: { user_id: req.userId },
      include: [{ model: Account, as: 'account' }],
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoriesStats: { [key: string]: number } = {};

    for (const transaction of transactions) {
      const amount = transaction.amount * ((transaction as any).account?.exchange_rate || 1);
      
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else if (transaction.type === 'expense') {
        totalExpense += amount;
      }

      if (transaction.category_id) {
        if (!categoriesStats[transaction.category_id]) {
          categoriesStats[transaction.category_id] = 0;
        }
        categoriesStats[transaction.category_id] += amount;
      }
    }

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoriesStats,
      transactionsCount: transactions.length,
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
