import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('currency_cache', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    base_currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    target_currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'openexchangerates',
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  // Создаем индексы
  await queryInterface.addIndex('currency_cache', ['base_currency', 'target_currency'], {
    unique: true,
    name: 'currency_cache_base_target_unique',
  });

  await queryInterface.addIndex('currency_cache', ['last_updated'], {
    name: 'currency_cache_last_updated_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('currency_cache');
} 