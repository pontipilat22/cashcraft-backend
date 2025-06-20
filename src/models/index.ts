import sequelize from '../config/database';
import { initUser, User } from './User';
import { initAccount, Account } from './Account';
import { initCategory, Category } from './Category';
import { initTransaction, Transaction } from './Transaction';
import { initDebt, Debt } from './Debt';
import { initRefreshToken, RefreshToken } from './RefreshToken';
import ExchangeRate from './ExchangeRate';
import CurrencyCache from './CurrencyCache';

// Инициализация моделей
initUser(sequelize);
initAccount(sequelize);
initCategory(sequelize);
initTransaction(sequelize);
initDebt(sequelize);
initRefreshToken(sequelize);
// ExchangeRate инициализируется в своем файле
// CurrencyCache инициализируется в своем файле

// Определение связей между моделями

// User имеет много Accounts
User.hasMany(Account, {
  foreignKey: 'user_id',
  as: 'accounts',
  onDelete: 'CASCADE',
});
Account.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User имеет много Categories (пользовательские категории)
User.hasMany(Category, {
  foreignKey: 'user_id',
  as: 'categories',
  onDelete: 'CASCADE',
});
Category.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User имеет много Transactions
User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'transactions',
  onDelete: 'CASCADE',
});
Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Account имеет много Transactions
Account.hasMany(Transaction, {
  foreignKey: 'account_id',
  as: 'transactions',
  onDelete: 'CASCADE',
});
Transaction.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account',
});

// Transaction может иметь второй Account (для переводов)
Transaction.belongsTo(Account, {
  foreignKey: 'to_account_id',
  as: 'toAccount',
});

// Category имеет много Transactions
Category.hasMany(Transaction, {
  foreignKey: 'category_id',
  as: 'transactions',
  onDelete: 'SET NULL',
});
Transaction.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
});

// User имеет много Debts
User.hasMany(Debt, {
  foreignKey: 'user_id',
  as: 'debts',
  onDelete: 'CASCADE',
});
Debt.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User имеет много RefreshTokens
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User имеет много ExchangeRates
User.hasMany(ExchangeRate, {
  foreignKey: 'user_id',
  as: 'exchangeRates',
  onDelete: 'CASCADE',
});
ExchangeRate.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

export {
  sequelize,
  User,
  Account,
  Category,
  Transaction,
  Debt,
  RefreshToken,
  ExchangeRate,
  CurrencyCache,
}; 
