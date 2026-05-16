import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Complaint = sequelize.define(
    'Complaint',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      complaint_no: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING(300), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.STRING(100), allowNull: true },
      status: {
        type: DataTypes.ENUM(
          'registered',
          'assigned',
          'in_progress',
          'resolved',
          'rejected'
        ),
        defaultValue: 'registered',
      },
      location_text: { type: DataTypes.STRING(500), allowNull: true },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      image_url: { type: DataTypes.STRING(500), allowNull: true },
      assigned_officer_name: { type: DataTypes.STRING(200), allowNull: true },
    },
    { tableName: 'complaints' }
  );
  return Complaint;
};
