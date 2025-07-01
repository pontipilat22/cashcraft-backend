import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ExchangeRateAttributes {
  id: number;
  user_id?: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  mode: 'auto' | 'manual';
  created_at?: Date;
  updated_at?: Date;
}

interface ExchangeRateCreationAttributes extends Optional<ExchangeRateAttributes, 'id' | 'user_id' | 'created_at' | 'updated_at'> {}

class ExchangeRate extends Model<ExchangeRateAttributes, ExchangeRateCreationAttributes> implements ExchangeRateAttributes {
  public id!: number;
  public user_id?: string;
  public from_currency!: string;
  public to_currency!: string;
  public rate!: number;
  public mode!: 'auto' | 'manual';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ExchangeRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    from_currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    to_currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
    },
    mode: {
      type: DataTypes.ENUM('auto', 'manual'),
      allowNull: false,
      defaultValue: 'manual',
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
    modelName: 'ExchangeRate',
    tableName: 'exchange_rates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['from_currency', 'to_currency'],
      },
    ],
  }
);

export default ExchangeRate;


