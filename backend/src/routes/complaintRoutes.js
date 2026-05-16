import { Router } from 'express';
import {
  createComplaint,
  listMyComplaints,
  listAllComplaints,
  getComplaint,
  updateComplaintStatus,
  addComplaintTimeline,
  addComplaintImage,
  validateCreateComplaint,
  validateStatus,
  validateTimeline,
} from '../controllers/complaintController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const r = Router();

r.post('/', requireAuth(), upload.single('image'), validateCreateComplaint, createComplaint);
r.get('/', requireAuth(), requireAdmin, listAllComplaints);
r.get('/my', requireAuth(), listMyComplaints);
r.get('/:id', requireAuth(), getComplaint);
r.put('/:id/status', requireAuth(), requireAdmin, validateStatus, updateComplaintStatus);
r.post('/:id/timeline', requireAuth(), requireAdmin, validateTimeline, addComplaintTimeline);
r.post('/:id/images', requireAuth(), upload.single('image'), addComplaintImage);

export default r;
