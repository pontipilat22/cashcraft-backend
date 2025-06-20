import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CurrencyCacheAttributes {
  id: number;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string; // 'openexchangerates', 'manual', etc.
  last_updated: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface CurrencyCacheCreationAttributes extends Optional<CurrencyCacheAttributes, 'id' | 'created_at' | 'updated_at'> {}

class CurrencyCache extends Model<CurrencyCacheAttributes, CurrencyCacheCreationAttributes> implements CurrencyCacheAttributes {
  declare id: number;
  declare base_currency: string;
  declare target_currency: string;
  declare rate: number;
  declare source: string;
  declare last_updated: Date;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

CurrencyCache.init(
  {
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
  },
  {
    sequelize,
    modelName: 'CurrencyCache',
    tableName: 'currency_cache',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['base_currency', 'target_currency'],
      },
      {
        fields: ['last_updated'],
      },
    ],
  }
);

export default CurrencyCache; 