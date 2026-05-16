import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const EmergencyContact = sequelize.define(
    'EmergencyContact',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      department_name: { type: DataTypes.STRING(200), allowNull: false },
      phone: { type: DataTypes.STRING(40), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      icon: { type: DataTypes.STRING(80), allowNull: true },
      priority: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'emergency_contacts',
      updatedAt: false,
    }
  );
  return EmergencyContact;
};
