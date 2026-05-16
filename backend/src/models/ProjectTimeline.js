import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProjectTimeline = sequelize.define(
    'ProjectTimeline',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      project_id: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING(300), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(50), allowNull: true },
    },
    {
      tableName: 'project_timeline',
      updatedAt: false,
    }
  );
  return ProjectTimeline;
};
