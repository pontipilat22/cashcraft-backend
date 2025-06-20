import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface CategoryAttributes {
  id: string;
  user_id?: string; // Опциональное поле для пользовательских категорий
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_system: boolean; // Системная категория или пользовательская
  created_at?: Date;
  updated_at?: Date;
  synced_at?: Date;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 
  'id' | 'is_system' | 'created_at' | 'updated_at'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public user_id?: string;
  public name!: string;
  public type!: 'income' | 'expense';
  public icon!: string;
  public color!: string;
  public is_system!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public synced_at?: Date;
}

export const initCategory = (sequelize: Sequelize): typeof Category => {
  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Category;
};
