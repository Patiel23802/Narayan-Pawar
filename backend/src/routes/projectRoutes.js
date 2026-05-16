import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectProgress,
  validateProject,
  validateProgress,
  validateProjectId,
  validateProjectTimeline,
  addProjectTimeline,
  deleteProject,
} from '../controllers/projectController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();

r.get('/', listProjects);
r.get('/:id', getProject);
r.post('/', requireAuth(), requireAdmin, validateProject, createProject);
r.put('/:id', requireAuth(), requireAdmin, updateProject);
r.put('/:id/progress', requireAuth(), requireAdmin, validateProgress, updateProjectProgress);
r.post('/:id/timeline', requireAuth(), requireAdmin, validateProjectTimeline, addProjectTimeline);
r.delete('/:id', requireAuth(), requireAdmin, validateProjectId, deleteProject);

export default r;
