import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Project = sequelize.define(
    'Project',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      project_code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(400), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      location_text: { type: DataTypes.STRING(500), allowNull: true },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      status: {
        type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
        defaultValue: 'in_progress',
      },
      progress_percent: { type: DataTypes.INTEGER, defaultValue: 0 },
      budget: { type: DataTypes.STRING(120), allowNull: true },
      contractor: { type: DataTypes.STRING(200), allowNull: true },
      start_date: { type: DataTypes.DATEONLY, allowNull: true },
      expected_completion_date: { type: DataTypes.DATEONLY, allowNull: true },
      image_url: { type: DataTypes.STRING(500), allowNull: true },
    },
    { tableName: 'projects' }
  );
  return Project;
};
