import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ComplaintTimeline = sequelize.define(
    'ComplaintTimeline',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      complaint_id: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: true },
      title: { type: DataTypes.STRING(300), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      officer_name: { type: DataTypes.STRING(200), allowNull: true },
    },
    {
      tableName: 'complaint_timeline',
      updatedAt: false,
    }
  );
  return ComplaintTimeline;
};
