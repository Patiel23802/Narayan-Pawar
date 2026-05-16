import { body, param, validationResult } from 'express-validator';
import { Project, ProjectTimeline } from '../models/index.js';

export async function listProjects(req, res) {
  const { status } = req.query;
  const where = {};
  if (status && status !== 'all' && status !== 'undefined') {
    where.status = status;
  }
  const projects = await Project.findAll({
    where,
    order: [['created_at', 'DESC']],
    include: [{ model: ProjectTimeline, as: 'timeline', required: false }],
  });
  return res.json({ projects });
}

export async function getProject(req, res) {
  const project = await Project.findByPk(req.params.id, {
    include: [{ model: ProjectTimeline, as: 'timeline', separate: true, order: [['created_at', 'ASC']] }],
  });
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  return res.json({ project });
}

export const validateProject = [
  body('title').trim().notEmpty(),
  body('project_code').optional().isString(),
  body('description').optional().isString(),
  body('location_text').optional().isString(),
  body('status').optional().isIn(['not_started', 'in_progress', 'completed']),
  body('progress_percent').optional().isInt({ min: 0, max: 100 }),
  body('budget').optional().isString(),
  body('contractor').optional().isString(),
  body('start_date').optional().isISO8601(),
  body('expected_completion_date').optional().isISO8601(),
  body('image_url').optional().isString(),
];

export async function createProject(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const code =
    req.body.project_code ||
    `PRJ-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const project = await Project.create({
    project_code: code,
    title: req.body.title,
    description: req.body.description || null,
    location_text: req.body.location_text || null,
    latitude: req.body.latitude ?? null,
    longitude: req.body.longitude ?? null,
    status: req.body.status || 'in_progress',
    progress_percent: req.body.progress_percent ?? 0,
    budget: req.body.budget || null,
    contractor: req.body.contractor || null,
    start_date: req.body.start_date || null,
    expected_completion_date: req.body.expected_completion_date || null,
    image_url: req.body.image_url || null,
  });
  return res.status(201).json({ project });
}

export async function updateProject(req, res) {
  const project = await Project.findByPk(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  const fields = [
    'title',
    'description',
    'location_text',
    'latitude',
    'longitude',
    'status',
    'progress_percent',
    'budget',
    'contractor',
    'start_date',
    'expected_completion_date',
    'image_url',
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) project[f] = req.body[f];
  }
  await project.save();
  return res.json({ project });
}

export const validateProgress = [
  param('id').isUUID(),
  body('progress_percent').isInt({ min: 0, max: 100 }),
  body('status').optional().isIn(['not_started', 'in_progress', 'completed']),
];

export async function updateProjectProgress(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const project = await Project.findByPk(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  project.progress_percent = req.body.progress_percent;
  if (req.body.status) project.status = req.body.status;
  await project.save();
  return res.json({ project });
}

export const validateProjectId = [param('id').isUUID()];

export const validateProjectTimeline = [
  param('id').isUUID(),
  body('title').trim().notEmpty(),
  body('description').optional().isString(),
  body('status').optional().isString(),
];

export async function addProjectTimeline(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const project = await Project.findByPk(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const entry = await ProjectTimeline.create({
    project_id: project.id,
    title: req.body.title,
    description: req.body.description || null,
    status: req.body.status || null,
  });
  return res.status(201).json({ timeline: entry });
}

export async function deleteProject(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const project = await Project.findByPk(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  await ProjectTimeline.destroy({ where: { project_id: project.id } });
  await project.destroy();
  return res.json({ ok: true });
}
