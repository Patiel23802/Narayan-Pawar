import { Router } from 'express';
import {
  getProfile,
  putProfile,
  uploadAvatar,
  validateProfile,
  listUsers,
  adminUpdateUser,
  validateAdminUserUpdate,
} from '../controllers/userController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const r = Router();
r.get('/', requireAuth(), requireAdmin, listUsers);
r.put('/:id', requireAuth(), requireAdmin, validateAdminUserUpdate, adminUpdateUser);
r.use(requireAuth());
r.get('/profile', getProfile);
r.put('/profile', validateProfile, putProfile);
r.post('/upload-avatar', upload.single('avatar'), uploadAvatar);

export default r;
