import { Router } from 'express';
import {
  listEmergency,
  createEmergency,
  validateEmergency,
  validateEmergencyId,
  validateEmergencyUpdate,
  updateEmergency,
  deleteEmergency,
} from '../controllers/emergencyController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();
r.get('/', listEmergency);
r.post('/', requireAuth(), requireAdmin, validateEmergency, createEmergency);
r.put('/:id', requireAuth(), requireAdmin, validateEmergencyUpdate, updateEmergency);
r.delete('/:id', requireAuth(), requireAdmin, validateEmergencyId, deleteEmergency);

export default r;
