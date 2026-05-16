import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Update = sequelize.define(
    'Update',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING(300), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      image_url: { type: DataTypes.STRING(500), allowNull: true },
      type: { type: DataTypes.STRING(80), allowNull: true },
    },
    {
      tableName: 'updates',
      updatedAt: false,
    }
  );
  return Update;
};
