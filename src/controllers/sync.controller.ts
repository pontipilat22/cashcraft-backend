import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Account, Transaction, Category, Debt } from '../models';
import { Op } from 'sequelize';

interface SyncData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  debts: Debt[];
  exchangeRates: any[];
  lastSyncAt?: string;
}

export const syncController = {
  // Синхронизация данных (отправка на сервер)
  syncData: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data, lastSyncAt }: { data: SyncData; lastSyncAt?: string } = req.body;

      console.log(`[Sync] Получены данные для синхронизации от пользователя ${userId}:`, {
        accounts: data.accounts?.length || 0,
        transactions: data.transactions?.length || 0,
        categories: data.categories?.length || 0,
        debts: data.debts?.length || 0,
        lastSyncAt
      });

      // Синхронизируем счета
      if (data.accounts) {
        for (const account of data.accounts) {
          await Account.upsert({
            ...account,
            user_id: userId,
            synced_at: new Date()
          });
        }
      }

      // Синхронизируем транзакции
      if (data.transactions) {
        for (const transaction of data.transactions) {
          await Transaction.upsert({
            ...transaction,
            user_id: userId,
            synced_at: new Date()
          });
        }
      }

      // Синхронизируем категории
      if (data.categories) {
        for (const category of data.categories) {
          await Category.upsert({
            ...category,
            user_id: userId,
            synced_at: new Date()
          });
        }
      }

      // Синхронизируем долги
      if (data.debts) {
        for (const debt of data.debts) {
          await Debt.upsert({
            ...debt,
            user_id: userId,
            synced_at: new Date()
          });
        }
      }

      const syncTime = new Date().toISOString();
      console.log(`[Sync] Синхронизация завершена для пользователя ${userId} в ${syncTime}`);

      res.json({
        success: true,
        syncTime,
        message: 'Data synchronized successfully'
      });
    } catch (error) {
      console.error('[Sync] Ошибка синхронизации:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  },

  // Загрузка данных с сервера
  downloadData: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      console.log(`[Sync] Загрузка данных для пользователя ${userId}`);

      // Получаем все данные пользователя
      const [accounts, transactions, categories, debts] = await Promise.all([
        Account.findAll({ where: { user_id: userId } }),
        Transaction.findAll({ where: { user_id: userId } }),
        Category.findAll({ where: { user_id: userId } }),
        Debt.findAll({ where: { user_id: userId } })
      ]);

      const syncData = {
        accounts,
        transactions,
        categories,
        debts,
        exchangeRates: [], // Пока пустой массив
        lastSyncAt: new Date().toISOString(),
        userId
      };

      console.log(`[Sync] Отправлены данные пользователю ${userId}:`, {
        accounts: accounts.length,
        transactions: transactions.length,
        categories: categories.length,
        debts: debts.length
      });

      res.json(syncData);
    } catch (error) {
      console.error('[Sync] Ошибка загрузки данных:', error);
      res.status(500).json({ error: 'Download failed' });
    }
  },

  // Получение статуса синхронизации
  getSyncStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Получаем количество записей каждого типа
      const [accountsCount, transactionsCount, categoriesCount, debtsCount] = await Promise.all([
        Account.count({ where: { user_id: userId } }),
        Transaction.count({ where: { user_id: userId } }),
        Category.count({ where: { user_id: userId } }),
        Debt.count({ where: { user_id: userId } })
      ]);

      // Получаем время последней синхронизации
      const lastSyncedAccount = await Account.findOne({
        where: { user_id: userId },
        order: [['synced_at', 'DESC']]
      });

      const lastSyncedTransaction = await Transaction.findOne({
        where: { user_id: userId },
        order: [['synced_at', 'DESC']]
      });

      const lastSyncTimes = [
        lastSyncedAccount?.synced_at,
        lastSyncedTransaction?.synced_at
      ].filter(Boolean);

      const lastSyncAt = lastSyncTimes.length > 0 
        ? new Date(Math.max(...lastSyncTimes.map(t => new Date(t!).getTime())))
        : null;

      res.json({
        counts: {
          accounts: accountsCount,
          transactions: transactionsCount,
          categories: categoriesCount,
          debts: debtsCount
        },
        lastSyncAt: lastSyncAt?.toISOString() || null,
        status: 'ok'
      });
    } catch (error) {
      console.error('[Sync] Ошибка получения статуса:', error);
      res.status(500).json({ error: 'Status check failed' });
    }
  }
}; 