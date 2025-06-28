import { Response } from 'express';
import { Debt, Account, Transaction } from '../models';
import { AuthRequest } from '../middleware/auth';
import sequelize from '../config/database';

// Получение всех долгов пользователя
export const getDebts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const debts = await Debt.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
    });

    res.json(debts);
  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создание нового долга
export const createDebt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, type, name, amount, isIncludedInTotal = true, dueDate } = req.body;

    // Проверяем, существует ли уже долг с таким id
    if (id) {
      const existingDebt = await Debt.findOne({
        where: { id, user_id: req.userId },
      });

      if (existingDebt) {
        // Обновляем существующий долг
        await existingDebt.update({
          type,
          name,
          amount,
          is_included_in_total: isIncludedInTotal,
          due_date: dueDate ? new Date(dueDate) : undefined,
        });

        res.json(existingDebt);
        return;
      }
    }

    const debt = await Debt.create({
      id: id || undefined, // Используем переданный id или генерируем новый
      user_id: req.userId!,
      type,
      name,
      amount,
      is_included_in_total: isIncludedInTotal,
      due_date: dueDate ? new Date(dueDate) : undefined,
    });

    res.status(201).json(debt);
  } catch (error) {
    console.error('Create debt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновление долга
export const updateDebt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const debt = await Debt.findOne({
      where: { id, user_id: req.userId },
    });

    if (!debt) {
      res.status(404).json({ error: 'Debt not found' });
      return;
    }

    // Преобразуем camelCase в snake_case для полей базы данных
    const dbUpdateData: any = {};
    if ('isIncludedInTotal' in updateData) {
      dbUpdateData.is_included_in_total = updateData.isIncludedInTotal;
    }
    if ('dueDate' in updateData) {
      dbUpdateData.due_date = updateData.dueDate ? new Date(updateData.dueDate) : null;
    }
    if ('name' in updateData) dbUpdateData.name = updateData.name;
    if ('amount' in updateData) dbUpdateData.amount = updateData.amount;
    if ('type' in updateData) dbUpdateData.type = updateData.type;

    await debt.update(dbUpdateData);
    res.json(debt);
  } catch (error) {
    console.error('Update debt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удаление долга
export const deleteDebt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const debt = await Debt.findOne({
      where: { id, user_id: req.userId },
    });

    if (!debt) {
      res.status(404).json({ error: 'Debt not found' });
      return;
    }

    await debt.destroy();
    res.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    console.error('Delete debt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Погашение долга (создание соответствующей транзакции)
export const payOffDebt = async (req: AuthRequest, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { accountId, amount, paymentDate = new Date() } = req.body;

    const debt = await Debt.findOne({
      where: { id, user_id: req.userId },
      transaction: t,
    });

    if (!debt) {
      await t.rollback();
      res.status(404).json({ error: 'Debt not found' });
      return;
    }

    // Проверяем счет
    const account = await Account.findOne({
      where: { id: accountId, user_id: req.userId },
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Создаем транзакцию для погашения долга
    const transaction = await Transaction.create({
      user_id: req.userId!,
      account_id: accountId,
      type: debt.type === 'owed_to_me' ? 'income' : 'expense',
      amount: amount || debt.amount,
      description: `Погашение долга: ${debt.name}`,
      date: paymentDate,
    }, { transaction: t });

    // Обновляем баланс счета
    if (debt.type === 'owed_to_me') {
      account.balance += (amount || debt.amount);
    } else {
      account.balance -= (amount || debt.amount);
    }
    await account.save({ transaction: t });

    // Удаляем долг или обновляем сумму
    if (amount && amount < debt.amount) {
      debt.amount -= amount;
      await debt.save({ transaction: t });
    } else {
      await debt.destroy({ transaction: t });
    }

    await t.commit();

    res.json({
      message: 'Debt payment processed successfully',
      transaction,
      remainingDebt: amount && amount < debt.amount ? debt.amount - amount : 0,
    });
  } catch (error) {
    await t.rollback();
    console.error('Pay off debt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получение статистики по долгам
export const getDebtStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const debts = await Debt.findAll({
      where: { user_id: req.userId },
    });

    let totalOwedToMe = 0;
    let totalOwedByMe = 0;

    for (const debt of debts) {
      if (debt.is_included_in_total) {
        if (debt.type === 'owed_to_me') {
          totalOwedToMe += debt.amount;
        } else {
          totalOwedByMe += debt.amount;
        }
      }
    }

    res.json({
      totalOwedToMe,
      totalOwedByMe,
      netDebt: totalOwedToMe - totalOwedByMe,
      debtsCount: debts.length,
    });
  } catch (error) {
    console.error('Get debt stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
