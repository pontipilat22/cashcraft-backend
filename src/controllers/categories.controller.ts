import { Response } from 'express';
import { Op } from 'sequelize';
import { Category, Transaction } from '../models';
import { AuthRequest } from '../middleware/auth';

// Получение всех категорий (системных и пользовательских)
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Category.findAll({
      where: {
        [Op.or]: [
          { is_system: true },
          { user_id: req.userId }
        ]
      },
      order: [['type', 'ASC'], ['name', 'ASC']],
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создание пользовательской категории
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, icon, color } = req.body;

    // Проверяем лимит категорий для бесплатных пользователей
    if (!req.user?.isPremiumActive()) {
      const userCategoriesCount = await Category.count({
        where: { user_id: req.userId },
      });

      if (userCategoriesCount >= 5) {
        res.status(403).json({ 
          error: 'Free users can create maximum 5 custom categories. Upgrade to premium for unlimited categories.' 
        });
        return;
      }
    }

    const category = await Category.create({
      user_id: req.userId!,
      name,
      type,
      icon,
      color,
      is_system: false,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновление категории
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findOne({
      where: { 
        id, 
        [Op.or]: [
          { user_id: req.userId },
          { is_system: true }
        ]
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Системные категории можно только переименовать
    if (category.is_system && Object.keys(updateData).some(key => key !== 'name')) {
      res.status(403).json({ error: 'System categories can only be renamed' });
      return;
    }

    await category.update(updateData);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удаление категории
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id, user_id: req.userId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (category.is_system) {
      res.status(403).json({ error: 'Cannot delete system categories' });
      return;
    }

    // Проверяем, используется ли категория в транзакциях
    const transactionCount = await Transaction.count({
      where: { category_id: id },
    });

    if (transactionCount > 0) {
      res.status(400).json({ 
        error: `Cannot delete category. It is used in ${transactionCount} transactions.` 
      });
      return;
    }

    await category.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Сброс категорий к дефолтным
export const resetCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Удаляем все пользовательские категории
    await Category.destroy({
      where: { user_id: req.userId, is_system: false },
    });

    // Создаем дефолтные категории
    const defaultCategories = [
      { name: 'Продукты', icon: '🛒', color: '#FF6B6B', type: 'expense' },
      { name: 'Транспорт', icon: '🚌', color: '#4ECDC4', type: 'expense' },
      { name: 'Развлечения', icon: '🎮', color: '#45B7D1', type: 'expense' },
      { name: 'Зарплата', icon: '💰', color: '#95E1D3', type: 'income' },
      { name: 'Подработка', icon: '💵', color: '#F38181', type: 'income' },
    ];

    const createdCategories = [];
    for (const cat of defaultCategories) {
      const category = await Category.create({
        user_id: req.userId!,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type as 'income' | 'expense',
        is_system: true,
      });
      createdCategories.push(category);
    }

    res.json({
      message: 'Categories reset successfully',
      categories: createdCategories,
    });
  } catch (error) {
    console.error('Reset categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
