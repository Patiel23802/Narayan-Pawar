import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      full_name: { type: DataTypes.STRING(200), allowNull: true },
      mobile: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: true },
      avatar_url: { type: DataTypes.STRING(500), allowNull: true },
      gender: { type: DataTypes.STRING(20), allowNull: true },
      dob: { type: DataTypes.DATEONLY, allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      ward_no: { type: DataTypes.STRING(20), allowNull: true, defaultValue: '42' },
      city: { type: DataTypes.STRING(120), allowNull: true, defaultValue: 'Mumbai' },
      role: {
        type: DataTypes.ENUM('citizen', 'admin'),
        allowNull: false,
        defaultValue: 'citizen',
      },
      is_mobile_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: 'users',
    }
  );
  return User;
};
