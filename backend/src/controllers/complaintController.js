import { Op } from 'sequelize';
import { body, param, validationResult } from 'express-validator';
import { Complaint, ComplaintTimeline, User } from '../models/index.js';
import { generateComplaintNo } from '../utils/complaintNo.js';
import { publicUploadPath } from '../middleware/upload.js';

export const validateCreateComplaint = [
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('location_text').optional().isString(),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
];

export async function createComplaint(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const complaint_no = await generateComplaintNo();
  let image_url = null;
  if (req.file) {
    image_url = publicUploadPath(req.file.filename);
  }
  const complaint = await Complaint.create({
    complaint_no,
    user_id: req.userId,
    title: req.body.title,
    description: req.body.description || null,
    category: req.body.category || null,
    location_text: req.body.location_text || null,
    latitude: req.body.latitude ?? null,
    longitude: req.body.longitude ?? null,
    image_url,
    status: 'registered',
  });
  await ComplaintTimeline.create({
    complaint_id: complaint.id,
    status: 'registered',
    title: 'Complaint Registered',
    description: 'Your complaint has been received.',
    officer_name: null,
  });
  return res.status(201).json({ complaint });
}

export async function listMyComplaints(req, res) {
  const { status } = req.query;
  const base = { user_id: req.userId };
  let where = { ...base };
  if (status === 'pending') {
    where.status = { [Op.in]: ['registered', 'assigned', 'in_progress'] };
  } else if (status === 'resolved') {
    where.status = { [Op.in]: ['resolved', 'rejected'] };
  } else if (status && status !== 'all') {
    where.status = status;
  }
  const complaints = await Complaint.findAll({
    where,
    order: [['created_at', 'DESC']],
    include: [{ model: ComplaintTimeline, as: 'timeline', required: false }],
  });
  return res.json({ complaints });
}

export async function listAllComplaints(req, res) {
  const { status } = req.query;
  const where = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  const complaints = await Complaint.findAll({
    where,
    order: [['created_at', 'DESC']],
    include: [
      { model: ComplaintTimeline, as: 'timeline', required: false },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'mobile', 'email', 'ward_no', 'city'],
      },
    ],
  });
  return res.json({ complaints });
}

export async function getComplaint(req, res) {
  const { id } = req.params;
  const complaint = await Complaint.findByPk(id, {
    include: [{ model: ComplaintTimeline, as: 'timeline', separate: true, order: [['created_at', 'ASC']] }],
  });
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  if (complaint.user_id !== req.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json({ complaint });
}

export const validateStatus = [
  param('id').isUUID(),
  body('status')
    .isIn(['registered', 'assigned', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Invalid status'),
  body('assigned_officer_name').optional({ nullable: true }).isString(),
];

export async function updateComplaintStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  complaint.status = req.body.status;
  if (req.body.assigned_officer_name !== undefined) {
    complaint.assigned_officer_name = req.body.assigned_officer_name;
  }
  await complaint.save();
  return res.json({ complaint });
}

export const validateTimeline = [
  param('id').isUUID(),
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('status').optional().isString(),
  body('officer_name').optional().isString(),
];

export async function addComplaintTimeline(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  const entry = await ComplaintTimeline.create({
    complaint_id: complaint.id,
    title: req.body.title,
    description: req.body.description || null,
    status: req.body.status || null,
    officer_name: req.body.officer_name || null,
  });
  return res.status(201).json({ timeline: entry });
}

export async function addComplaintImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  if (complaint.user_id !== req.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  complaint.image_url = publicUploadPath(req.file.filename);
  await complaint.save();
  return res.json({ image_url: complaint.image_url });
}
