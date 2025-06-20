import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { EncryptionService } from '../utils/encryption';

export interface TransactionAttributes {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: Date;
  description?: string;
  to_account_id?: string; // Для переводов между счетами
  created_at: Date;
  updated_at: Date;
  synced_at?: Date;
}

export interface TransactionCreationAttributes extends Optional<TransactionAttributes, 
  'id' | 'created_at' | 'updated_at'> {}

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public user_id!: string;
  public account_id!: string;
  public category_id?: string;
  public amount!: number;
  public type!: 'income' | 'expense' | 'transfer';
  public date!: Date;
  public description?: string;
  public to_account_id?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public synced_at?: Date;
}

export const initTransaction = (sequelize: Sequelize): typeof Transaction => {
  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('amount');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      type: {
        type: DataTypes.ENUM('income', 'expense', 'transfer'),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const encrypted = this.getDataValue('description');
          if (!encrypted) return null;
          try {
            return EncryptionService.decrypt(encrypted);
          } catch {
            return encrypted;
          }
        },
        set(value: string) {
          if (value) {
            this.setDataValue('description', EncryptionService.encrypt(value));
          } else {
            this.setDataValue('description', undefined);
          }
        }
      },
      to_account_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'transactions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['account_id'],
        },
        {
          fields: ['date'],
        },
        {
          fields: ['type'],
        },
      ],
    }
  );

  return Transaction;
};
