import { body, param, validationResult } from 'express-validator';
import { User } from '../models/index.js';
import { publicUploadPath } from '../middleware/upload.js';

export const validateProfile = [
  body('full_name').optional().isString(),
  body('email').optional({ values: 'falsy' }).isEmail(),
  body('gender').optional().isString(),
  body('dob').optional({ values: 'falsy' }).isISO8601(),
  body('address').optional().isString(),
  body('ward_no').optional().isString(),
  body('city').optional().isString(),
];

export async function getProfile(req, res) {
  return res.json({
    user: {
      id: req.user.id,
      full_name: req.user.full_name,
      mobile: req.user.mobile,
      email: req.user.email,
      avatar_url: req.user.avatar_url,
      gender: req.user.gender,
      dob: req.user.dob,
      address: req.user.address,
      ward_no: req.user.ward_no,
      city: req.user.city,
      role: req.user.role,
    },
  });
}

export async function putProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const allowed = ['full_name', 'email', 'gender', 'dob', 'address', 'ward_no', 'city'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  return res.json({ user: req.user.toJSON() });
}

export async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = publicUploadPath(req.file.filename);
  req.user.avatar_url = url;
  await req.user.save();
  return res.json({ avatar_url: url });
}

export async function listUsers(_req, res) {
  const users = await User.findAll({
    order: [['created_at', 'DESC']],
    attributes: [
      'id',
      'full_name',
      'mobile',
      'email',
      'avatar_url',
      'gender',
      'dob',
      'address',
      'ward_no',
      'city',
      'role',
      'is_mobile_verified',
      'created_at',
    ],
  });
  return res.json({ users });
}

export const validateAdminUserUpdate = [
  param('id').isUUID(),
  body('full_name').optional().isString(),
  body('email').optional({ values: 'falsy' }).isEmail(),
  body('gender').optional({ values: 'falsy' }).isString(),
  body('dob').optional({ values: 'falsy' }).isISO8601(),
  body('address').optional({ values: 'falsy' }).isString(),
  body('ward_no').optional({ values: 'falsy' }).isString(),
  body('city').optional({ values: 'falsy' }).isString(),
  body('role').optional().isIn(['citizen', 'admin']),
];

export async function adminUpdateUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const allowed = ['full_name', 'email', 'gender', 'dob', 'address', 'ward_no', 'city', 'role'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }
  await user.save();
  return res.json({ user });
}
