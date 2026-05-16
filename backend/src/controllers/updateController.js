import { body, param, validationResult } from 'express-validator';
import { Update } from '../models/index.js';

export async function listUpdates(req, res) {
  const updates = await Update.findAll({ order: [['created_at', 'DESC']] });
  return res.json({ updates });
}

export const validateUpdate = [
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('type').optional().isString(),
  body('image_url').optional().isString(),
];

export async function createUpdate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const row = await Update.create({
    title: req.body.title,
    description: req.body.description || null,
    type: req.body.type || 'announcement',
    image_url: req.body.image_url || null,
  });
  return res.status(201).json({ update: row });
}

export const validateUpdateId = [param('id').isUUID()];

export async function updateUpdate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const row = await Update.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: 'Update not found' });
  const allowed = ['title', 'description', 'type', 'image_url'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) row[key] = req.body[key];
  }
  await row.save();
  return res.json({ update: row });
}

export async function deleteUpdate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const row = await Update.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: 'Update not found' });
  await row.destroy();
  return res.json({ ok: true });
}
