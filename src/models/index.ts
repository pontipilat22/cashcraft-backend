import sequelize from '../config/database';
import { initUser, User } from './User';
import ExchangeRate from './ExchangeRate';
import CurrencyCache from './CurrencyCache';

// Инициализация моделей
initUser(sequelize);

// ExchangeRate инициализируется в своем файле
// CurrencyCache инициализируется в своем файле





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
  ExchangeRate,
  CurrencyCache,
}; 
