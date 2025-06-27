/* ──────────────────────────────────────────────────────────── *
 *  CashCraft – Sync Controller                                *
 *  full TypeScript file                                       *
 * ──────────────────────────────────────────────────────────── */

import { Request, Response } from 'express';
import { AuthRequest }          from '../middleware/auth';

import {
  Account,
  Transaction,
  Category,
  Debt,
  RefreshToken,
} from '../models';

import { sequelize }            from '../models';  // <- ВАЖНО: отдельный import!

/* ─────────────── вспомогательные типы ─────────────── */
interface SyncData {
  accounts:     Account[];
  categories:   Category[];
  transactions: Transaction[];
  debts:        Debt[];
  exchangeRates: any[];
  lastSyncAt?:   string;
}

/* ─────────────── 1. PUSH (моб → сервер) ─────────────── */
export const syncData = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { data }: { data: SyncData } = req.body ?? { data: {} };
  console.log(`[Sync→] user=${userId}`, {
    acc: data?.accounts?.length ?? 0,
    cat: data?.categories?.length ?? 0,
    trx: data?.transactions?.length ?? 0,
    deb: data?.debts?.length ?? 0,
  });

  const t = await sequelize.transaction();
  try {
    /* 1. Accounts */
    if (data.accounts?.length) {
      for (const acc of data.accounts) {
        if (!acc.id || typeof acc.id !== 'string') continue;
        await Account.upsert({ ...acc, user_id: userId, synced_at: new Date() }, { transaction: t });
      }
    }

    /* 2. Categories  (идут ДО транзакций) */
    if (data.categories?.length) {
      for (const cat of data.categories) {
        if (!cat.id || typeof cat.id !== 'string') continue;
        await Category.upsert({ ...cat, user_id: userId, synced_at: new Date() }, { transaction: t });
      }
    }

    /* 3. Transactions */
    const isUUID = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    if (data.transactions?.length) {
      for (const trx of data.transactions) {
        if (!trx.id || typeof trx.id !== 'string')       continue;
        if (!trx.account_id || typeof trx.account_id !== 'string') continue;

        await Transaction.upsert(
          {
            ...trx,
            category_id: trx.category_id && isUUID(trx.category_id) ? trx.category_id : undefined,
            user_id:     userId,
            synced_at:   new Date(),
          },
          { transaction: t },
        );
      }
    }

    /* 4. Debts */
    if (data.debts?.length) {
      for (const debt of data.debts) {
        if (!debt.id || typeof debt.id !== 'string') continue;
        await Debt.upsert({ ...debt, user_id: userId, synced_at: new Date() }, { transaction: t });
      }
    }

    await t.commit();
    res.json({ success: true, syncTime: new Date().toISOString() });
  } catch (err) {
    await t.rollback();
    console.error('[Sync×]', err);
    res.status(500).json({ error: 'Sync failed' });
  }
};

/* ─────────────── 2. PULL (сервер → моб) ─────────────── */
export const downloadData = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

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
    exchangeRates: [],
    lastSyncAt:   new Date().toISOString(),
    userId,
  });
};

/* ─────────────── 3. STATUS ─────────────── */
export const getSyncStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const [accountsCount, categoriesCount, transactionsCount, debtsCount] = await Promise.all([
    Account.count({ where: { user_id: userId } }),
    Category.count({ where: { user_id: userId } }),
    Transaction.count({ where: { user_id: userId } }),
    Debt.count({ where: { user_id: userId } }),
  ]);

  const lastSyncRow = await Transaction.findOne({
    where:  { user_id: userId },
    order:  [['synced_at', 'DESC']],
    attributes: ['synced_at'],
  });

  res.json({
    counts:     { accounts: accountsCount, categories: categoriesCount, transactions: transactionsCount, debts: debtsCount },
    lastSyncAt: lastSyncRow?.synced_at ?? null,
    status:     'ok',
  });
};

/* ─────────────── 4. WIPE ─────────────── */
export const wipeData = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    await sequelize.transaction(async t => {
      await Promise.all([
        Transaction.destroy ( { where: { user_id: userId }, transaction: t } ),
        Debt.destroy        ( { where: { user_id: userId }, transaction: t } ),
        Account.destroy     ( { where: { user_id: userId }, transaction: t } ),
        Category.destroy    ( { where: { user_id: userId }, transaction: t } ),
        RefreshToken.destroy( { where: { user_id: userId }, transaction: t } ),
      ]);
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Wipe×]', err);
    res.status(500).json({ success: false });
  }
};
