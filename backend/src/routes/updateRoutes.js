import { Router } from 'express';
import {
  listUpdates,
  createUpdate,
  updateUpdate,
  deleteUpdate,
  validateUpdate,
  validateUpdateId,
} from '../controllers/updateController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();
r.get('/', listUpdates);
r.post('/', requireAuth(), requireAdmin, validateUpdate, createUpdate);
r.put('/:id', requireAuth(), requireAdmin, validateUpdateId, validateUpdate, updateUpdate);
r.delete('/:id', requireAuth(), requireAdmin, validateUpdateId, deleteUpdate);

export default r;
