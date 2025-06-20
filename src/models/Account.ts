import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { EncryptionService } from '../utils/encryption';

export type AccountType = 'cash' | 'card' | 'bank' | 'savings' | 'debt' | 'credit';

export interface AccountAttributes {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  exchange_rate: number;
  card_number?: string;
  color?: string;
  icon?: string;
  is_default: boolean;
  is_included_in_total: boolean;
  target_amount?: number;
  credit_start_date?: Date;
  credit_term?: number;
  credit_rate?: number;
  credit_payment_type?: 'annuity' | 'differentiated';
  credit_initial_amount?: number;
  created_at: Date;
  updated_at: Date;
  synced_at?: Date;
}

export interface AccountCreationAttributes extends Optional<AccountAttributes, 
  'id' | 'balance' | 'currency' | 'exchange_rate' | 'is_default' | 'is_included_in_total' | 'created_at' | 'updated_at'> {}

export class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: string;
  public user_id!: string;
  public name!: string;
  public type!: AccountType;
  public balance!: number;
  public currency!: string;
  public exchange_rate!: number;
  public card_number?: string;
  public color?: string;
  public icon?: string;
  public is_default!: boolean;
  public is_included_in_total!: boolean;
  public target_amount?: number;
  public credit_start_date?: Date;
  public credit_term?: number;
  public credit_rate?: number;
  public credit_payment_type?: 'annuity' | 'differentiated';
  public credit_initial_amount?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public synced_at?: Date;

  // Метод для расчета ежемесячного платежа по кредиту
  public calculateMonthlyPayment(): number | null {
    if (this.type !== 'credit' || !this.credit_initial_amount || !this.credit_rate || !this.credit_term) {
      return null;
    }

    const principal = this.credit_initial_amount;
    const monthlyRate = this.credit_rate / 100 / 12;
    const term = this.credit_term;

    if (this.credit_payment_type === 'annuity') {
      // Аннуитетный платеж
      return principal * (monthlyRate * Math.pow(1 + monthlyRate, term)) / 
             (Math.pow(1 + monthlyRate, term) - 1);
    } else {
      // Дифференцированный платеж (возвращаем первый платеж)
      const principalPayment = principal / term;
      const interestPayment = principal * monthlyRate;
      return principalPayment + interestPayment;
    }
  }
}

export const initAccount = (sequelize: Sequelize): typeof Account => {
  Account.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('cash', 'card', 'bank', 'savings', 'debt', 'credit'),
        allowNull: false,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        get() {
          const value = this.getDataValue('balance');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'RUB',
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(10, 6),
        defaultValue: 1,
        get() {
          const value = this.getDataValue('exchange_rate');
          return value ? parseFloat(value.toString()) : 1;
        },
      },
      card_number: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value: string) {
          if (value) {
            this.setDataValue('card_number', EncryptionService.encrypt(value));
          }
        },
        get() {
          const value = this.getDataValue('card_number');
          return value ? EncryptionService.decrypt(value) : null;
        },
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_included_in_total: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      target_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('target_amount');
          return value ? parseFloat(value.toString()) : null;
        },
      },
      credit_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      credit_term: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      credit_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('credit_rate');
          return value ? parseFloat(value.toString()) : null;
        },
      },
      credit_payment_type: {
        type: DataTypes.ENUM('annuity', 'differentiated'),
        allowNull: true,
      },
      credit_initial_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        get() {
          const value = this.getDataValue('credit_initial_amount');
          return value ? parseFloat(value.toString()) : null;
        },
      },
      synced_at: {
        type: DataTypes.DATE,
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
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'accounts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Account;
};
