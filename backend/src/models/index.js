import { sequelize } from '../config/database.js';
import defineUser from './User.js';
import defineOtpLog from './OtpLog.js';
import defineComplaint from './Complaint.js';
import defineComplaintTimeline from './ComplaintTimeline.js';
import defineProject from './Project.js';
import defineProjectTimeline from './ProjectTimeline.js';
import defineUpdate from './Update.js';
import defineEmergencyContact from './EmergencyContact.js';
import defineRepresentative from './Representative.js';

const User = defineUser(sequelize);
const OtpLog = defineOtpLog(sequelize);
const Complaint = defineComplaint(sequelize);
const ComplaintTimeline = defineComplaintTimeline(sequelize);
const Project = defineProject(sequelize);
const ProjectTimeline = defineProjectTimeline(sequelize);
const Update = defineUpdate(sequelize);
const EmergencyContact = defineEmergencyContact(sequelize);
const Representative = defineRepresentative(sequelize);

User.hasMany(Complaint, { foreignKey: 'user_id', as: 'complaints' });
Complaint.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Complaint.hasMany(ComplaintTimeline, {
  foreignKey: 'complaint_id',
  as: 'timeline',
});
ComplaintTimeline.belongsTo(Complaint, { foreignKey: 'complaint_id', as: 'complaint' });

Project.hasMany(ProjectTimeline, { foreignKey: 'project_id', as: 'timeline' });
ProjectTimeline.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

export {
  sequelize,
  User,
  OtpLog,
  Complaint,
  ComplaintTimeline,
  Project,
  ProjectTimeline,
  Update,
  EmergencyContact,
  Representative,
};
