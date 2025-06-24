import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Account, Transaction, Category, Debt /*, ExchangeRate */ } from '../models';
import { Op, Sequelize } from 'sequelize';

// 👇  если sequelize экспортируется из models/index.ts — так; иначе поправь путь
import { sequelize } from '../models';

interface SyncData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  exchangeRates: any[];
  lastSyncAt?: string;
}

export const syncController = {
  /* ───────────────────────────────  PUSH (мобильный → сервер) ─────────────────────────────── */
  syncData: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data }: { data: SyncData } = req.body;

    console.log(`[Sync→] user=${userId}`, {
      acc: data.accounts?.length ?? 0,
      cat: data.categories?.length ?? 0,
      trx: data.transactions?.length ?? 0,
      deb: data.debts?.length ?? 0,
    });

    const t = await sequelize.transaction();                // 1️⃣ транзакция БД
    try {
      /* 1. Accounts ──────────────────────────────────────────────────────────────────────── */
      if (data.accounts?.length) {
        for (const acc of data.accounts) {
          await Account.upsert(
            { ...acc, user_id: userId, synced_at: new Date() },
            { transaction: t }
          );
        }
      }

      /* 2. Categories (идут ДО транзакций!) ─────────────────────────────────────────────── */
      if (data.categories?.length) {
        for (const cat of data.categories) {
          await Category.upsert(
            { ...cat, user_id: userId, synced_at: new Date() },
            { transaction: t }
          );
        }
      }

      /* 3. Transactions ─────────────────────────────────────────────────────────────────── */
      if (data.transactions?.length) {
        for (const trx of data.transactions) {
          await Transaction.upsert(
            { ...trx, user_id: userId, synced_at: new Date() },
            { transaction: t }
          );
        }
      }

      /* 4. Debts ─────────────────────────────────────────────────────────────────────────── */
      if (data.debts?.length) {
        for (const debt of data.debts) {
          await Debt.upsert(
            { ...debt, user_id: userId, synced_at: new Date() },
            { transaction: t }
          );
        }
      }

      /* 5. (если понадобятся exchangeRates — добавь сюда) */

      await t.commit();                                      // 2️⃣ фиксация
      const syncTime = new Date().toISOString();
      console.log(`[Sync✓] user=${userId} at ${syncTime}`);

      res.json({ success: true, syncTime });
    } catch (err) {
      await t.rollback();                                    // 3️⃣ откат при любой ошибке
      console.error('[Sync×] ', err);
      res.status(500).json({ error: 'Sync failed' });
    }
  },

  /* ───────────────────────────────  PULL (сервер → мобильный) ────────────────────────────── */
  downloadData: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [accounts, categories, transactions, debts] = await Promise.all([
      Account.findAll({ where: { user_id: userId } }),
      Category.findAll({ where: { user_id: userId } }),
      Transaction.findAll({ where: { user_id: userId } }),
      Debt.findAll({ where: { user_id: userId } }),
    ]);

    res.json({
      accounts,
      categories,
      transactions,
      debts,
      exchangeRates: [],              // если позже нужны — заполни
      lastSyncAt: new Date().toISOString(),
      userId,
    });
  },

  /* ───────────────────────────────  STATUS (не менялся) ─────────────────────────────────── */
  getSyncStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [accountsCount, categoriesCount, transactionsCount, debtsCount] = await Promise.all([
      Account.count({ where: { user_id: userId } }),
      Category.count({ where: { user_id: userId } }),
      Transaction.count({ where: { user_id: userId } }),
      Debt.count({ where: { user_id: userId } }),
    ]);

    const lastSyncRow = await Transaction.findOne({
      where: { user_id: userId },
      order: [['synced_at', 'DESC']],
      attributes: ['synced_at'],
    });

    res.json({
      counts: { accounts: accountsCount, categories: categoriesCount, transactions: transactionsCount, debts: debtsCount },
      lastSyncAt: lastSyncRow?.synced_at ?? null,
      status: 'ok',
    });
  },
};
