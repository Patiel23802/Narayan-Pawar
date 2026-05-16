import { Router } from 'express';
import {
  getRepresentative,
  putRepresentative,
  validateRepresentative,
  uploadRepresentativePhoto,
} from '../controllers/representativeController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const r = Router();
r.get('/', getRepresentative);
r.put('/', requireAuth(), requireAdmin, validateRepresentative, putRepresentative);
r.post('/photo', requireAuth(), requireAdmin, upload.single('photo'), uploadRepresentativePhoto);

export default r;
