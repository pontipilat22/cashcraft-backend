import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';
import config from '../config/config';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  display_name?: string;
  is_premium: boolean;
  premium_expires_at?: Date;
  is_guest: boolean;
  google_id?: string;
  is_verified: boolean;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_premium' | 'is_guest' | 'is_verified' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public display_name?: string;
  public is_premium!: boolean;
  public premium_expires_at?: Date;
  public is_guest!: boolean;
  public google_id?: string;
  public is_verified!: boolean;
  public last_login?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Метод для проверки пароля
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Метод для хеширования пароля перед сохранением
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcrypt.rounds);
  }

  // Проверка активной подписки
  public isPremiumActive(): boolean {
    if (!this.is_premium) return false;
    if (!this.premium_expires_at) return true;
    return new Date() < new Date(this.premium_expires_at);
  }
}

export const initUser = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      display_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_premium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      premium_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_guest: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await User.hashPassword(user.password);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await User.hashPassword(user.password);
          }
        },
      },
    }
  );

  return User;
};
