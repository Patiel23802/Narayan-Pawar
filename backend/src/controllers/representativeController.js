import { body, validationResult } from 'express-validator';
import { Representative } from '../models/index.js';
import { publicUploadPath } from '../middleware/upload.js';

export async function getRepresentative(req, res) {
  let rep = await Representative.findOne();
  if (!rep) {
    rep = await Representative.create({
      name: 'Narayan Pawar',
      title: 'नगरसेवक — वॉर्ड ४२',
      ward_no: '42',
      city: 'Mumbai',
      bio: 'नागरिकांच्या सेवेसाठी समर्पित.',
      vision: 'स्वच्छ, सुरक्षित आणि सक्षम वॉर्ड.',
      development_highlights: 'रस्ते, पार्क, स्ट्रीट लाईटिंग व सामाजिक उपक्रम.',
      years_experience: 12,
      completed_projects: 48,
      photo_url: null,
      email: 'narayan.pawar@example.com',
      phone: '+91 98765 43210',
      office_address: 'वॉर्ड कार्यालय, वॉर्ड ४२',
      social_whatsapp: '919876543210',
    });
  }
  return res.json({ representative: rep });
}

export const validateRepresentative = [
  body('name').optional().isString(),
  body('title').optional().isString(),
  body('ward_no').optional().isString(),
  body('city').optional().isString(),
  body('bio').optional().isString(),
  body('vision').optional().isString(),
  body('development_highlights').optional().isString(),
  body('years_experience').optional().isInt(),
  body('completed_projects').optional().isInt(),
  body('photo_url').optional().isString(),
  body('email').optional().isString(),
  body('phone').optional().isString(),
  body('office_address').optional().isString(),
  body('social_whatsapp').optional().isString(),
  body('social_facebook').optional().isString(),
  body('social_instagram').optional().isString(),
];

export async function putRepresentative(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  let rep = await Representative.findOne();
  if (!rep) {
    rep = await Representative.create({});
  }
  const fields = [
    'name',
    'title',
    'ward_no',
    'city',
    'bio',
    'vision',
    'development_highlights',
    'years_experience',
    'completed_projects',
    'photo_url',
    'email',
    'phone',
    'office_address',
    'social_whatsapp',
    'social_facebook',
    'social_instagram',
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) rep[f] = req.body[f];
  }
  await rep.save();
  return res.json({ representative: rep });
}

export async function uploadRepresentativePhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  let rep = await Representative.findOne();
  if (!rep) {
    rep = await Representative.create({});
  }
  rep.photo_url = publicUploadPath(req.file.filename);
  await rep.save();
  return res.json({ photo_url: rep.photo_url, representative: rep });
}
