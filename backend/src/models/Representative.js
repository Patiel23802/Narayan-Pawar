import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Representative = sequelize.define(
    'Representative',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(200), allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: true },
      ward_no: { type: DataTypes.STRING(20), allowNull: true },
      city: { type: DataTypes.STRING(120), allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      vision: { type: DataTypes.TEXT, allowNull: true },
      development_highlights: { type: DataTypes.TEXT, allowNull: true },
      years_experience: { type: DataTypes.INTEGER, allowNull: true },
      completed_projects: { type: DataTypes.INTEGER, allowNull: true },
      photo_url: { type: DataTypes.STRING(500), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(40), allowNull: true },
      office_address: { type: DataTypes.TEXT, allowNull: true },
      social_whatsapp: { type: DataTypes.STRING(40), allowNull: true },
      social_facebook: { type: DataTypes.STRING(500), allowNull: true },
      social_instagram: { type: DataTypes.STRING(500), allowNull: true },
    },
    { tableName: 'representative' }
  );
  return Representative;
};
