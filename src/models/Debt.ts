import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface DebtAttributes {
  id: string;
  user_id: string;
  type: 'owed_to_me' | 'owed_by_me';
  name: string;
  amount: number;
  is_included_in_total: boolean;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
  synced_at?: Date;
}

export interface DebtCreationAttributes extends Optional<DebtAttributes, 
  'id' | 'is_included_in_total' | 'created_at' | 'updated_at'> {}

export class Debt extends Model<DebtAttributes, DebtCreationAttributes> implements DebtAttributes {
  public id!: string;
  public user_id!: string;
  public type!: 'owed_to_me' | 'owed_by_me';
  public name!: string;
  public amount!: number;
  public is_included_in_total!: boolean;
  public due_date?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public synced_at?: Date;

  // Проверка просроченности долга
  public isOverdue(): boolean {
    if (!this.due_date) return false;
    return new Date() > new Date(this.due_date);
  }
}

export const initDebt = (sequelize: Sequelize): typeof Debt => {
  Debt.init(
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
      type: {
        type: DataTypes.ENUM('owed_to_me', 'owed_by_me'),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('amount');
          return value ? parseFloat(value.toString()) : 0;
        },
      },
      is_included_in_total: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Debt',
      tableName: 'debts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Debt;
};

