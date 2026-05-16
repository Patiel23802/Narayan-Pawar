import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const OtpLog = sequelize.define(
    'OtpLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      mobile: { type: DataTypes.STRING(20), allowNull: false },
      otp: { type: DataTypes.STRING(10), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: 'otp_logs',
      updatedAt: false,
    }
  );
  return OtpLog;
};
