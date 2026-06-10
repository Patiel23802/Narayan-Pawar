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
// Register /profile before /:id — otherwise PUT /profile matches /:id with id="profile"
// and incorrectly requires admin access.
r.use(requireAuth());
r.get('/profile', getProfile);
r.put('/profile', validateProfile, putProfile);
r.post('/upload-avatar', upload.single('avatar'), uploadAvatar);
r.get('/', requireAdmin, listUsers);
r.put('/:id', requireAdmin, validateAdminUserUpdate, adminUpdateUser);

export default r;
