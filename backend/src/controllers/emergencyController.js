import { body, param, validationResult } from 'express-validator';
import { EmergencyContact } from '../models/index.js';

export async function listEmergency(req, res) {
  const contacts = await EmergencyContact.findAll({
    order: [
      ['priority', 'DESC'],
      ['created_at', 'ASC'],
    ],
  });
  return res.json({ contacts });
}

export const validateEmergency = [
  body('department_name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('priority').optional().isInt(),
];

export const validateEmergencyId = [param('id').isUUID()];

export async function createEmergency(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const row = await EmergencyContact.create({
    department_name: req.body.department_name,
    phone: req.body.phone,
    description: req.body.description || null,
    icon: req.body.icon || null,
    priority: req.body.priority ?? 0,
  });
  return res.status(201).json({ contact: row });
}

export const validateEmergencyUpdate = [
  param('id').isUUID(),
  body('department_name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('icon').optional().isString(),
  body('priority').optional().isInt(),
];

export async function updateEmergency(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const row = await EmergencyContact.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: 'Contact not found' });
  const fields = ['department_name', 'phone', 'description', 'icon', 'priority'];
  for (const f of fields) {
    if (req.body[f] !== undefined) row[f] = req.body[f];
  }
  await row.save();
  return res.json({ contact: row });
}

export async function deleteEmergency(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const row = await EmergencyContact.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: 'Contact not found' });
  await row.destroy();
  return res.json({ ok: true });
}
