import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface RefreshTokenAttributes {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 
  'id' | 'created_at' | 'updated_at'> {}

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: string;
  public user_id!: string;
  public token!: string;
  public expires_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Проверка истечения токена
  public isExpired(): boolean {
    return new Date() > new Date(this.expires_at);
  }
}

export const initRefreshToken = (sequelize: Sequelize): typeof RefreshToken => {
  RefreshToken.init(
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
      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
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
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['token'],
        },
      ],
    }
  );

  return RefreshToken;
}; 

export interface RefreshTokenAttributes {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 
  'id' | 'created_at' | 'updated_at'> {}
