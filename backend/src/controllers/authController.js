import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User, OtpLog } from '../models/index.js';
import { getFirebaseAdmin, isFirebaseConfigured, mobile10FromFirebasePhone } from '../utils/firebaseAdmin.js';
import { isSmsConfigured, sendOtpSms } from '../utils/sms.js';
import { signUserToken } from '../utils/jwt.js';
import { Op } from 'sequelize';

const OTP_TTL_MS = 10 * 60 * 1000;

function devOtp() {
  return String(process.env.DEV_OTP || '123456');
}

/** Fixed dev-only credentials for password login (non-production or ALLOW_DUMMY_LOGIN=1). */
const DUMMY_LOGIN_MOBILE = '8888888888';
const DUMMY_LOGIN_PASSWORD = 'dummy123';

function dummyLoginAllowed() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DUMMY_LOGIN === '1';
}

export async function otpConfig(_req, res) {
  return res.json({
    otp_auth_mode: process.env.OTP_AUTH_MODE || 'backend',
    firebase_configured: isFirebaseConfigured(),
    firebase_project: process.env.FIREBASE_PROJECT_ID || 'politics-c7b50',
    sms_configured: isSmsConfigured(),
    sms_provider: process.env.SMS_PROVIDER || null,
    /** When false, backend /send-otp only stores DEV_OTP (use Firebase on device or set SMS_PROVIDER). */
    backend_sends_sms: isSmsConfigured(),
  });
}

export const validateSendOtp = [body('mobile').trim().isLength({ min: 10, max: 15 })];

function firebaseOnlyAuth() {
  return String(process.env.OTP_AUTH_MODE || '').trim().toLowerCase() === 'firebase';
}

export async function sendOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (firebaseOnlyAuth()) {
    return res.status(400).json({
      error: 'OTP is sent by Firebase on the mobile app. Rebuild the APK with Firebase Phone Auth enabled.',
    });
  }
  const { mobile } = req.body;
  let otp;
  if (isSmsConfigured()) {
    otp = String(Math.floor(100000 + Math.random() * 900000));
    try {
      await sendOtpSms(mobile, otp);
    } catch (err) {
      console.error('SMS send failed:', err.message);
      return res.status(502).json({ error: `Failed to send SMS: ${err.message}` });
    }
  } else {
    // No server SMS provider — mobile should use Firebase Phone Auth on device, or DEV_OTP in dev.
    otp = devOtp();
  }
  const expires_at = new Date(Date.now() + OTP_TTL_MS);
  await OtpLog.create({ mobile, otp, expires_at, is_used: false });
  const exposeDev =
    process.env.EXPOSE_DEV_OTP === '1' ||
    (process.env.NODE_ENV !== 'production' && !isSmsConfigured());
  return res.json({
    message: 'OTP sent successfully',
    ...(exposeDev ? { dev_otp: otp } : {}),
  });
}

export const validateVerifyOtp = [
  body('mobile').trim().isLength({ min: 10, max: 15 }),
  body('otp').trim().isLength({ min: 4, max: 10 }),
];

export async function verifyOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { mobile, otp } = req.body;
  const row = await OtpLog.findOne({
    where: {
      mobile,
      is_used: false,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [['created_at', 'DESC']],
  });
  const devBypass = !firebaseOnlyAuth() && !isSmsConfigured() && otp === devOtp();
  const valid = devBypass || (row && row.otp === otp);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  if (row) {
    row.is_used = true;
    await row.save();
  }
  const user = await upsertVerifiedCitizen(mobile);
  const token = signUserToken(user);
  return res.json({ token, user: userToPublic(user) });
}

export const validateFirebasePhone = [body('idToken').trim().notEmpty()];

/** Exchange Firebase Phone Auth idToken (after SMS verified on device) for Civic Pulse JWT. */
export async function verifyFirebasePhone(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (!isFirebaseConfigured()) {
    return res.status(503).json({ error: 'Firebase is not configured on the server' });
  }

  let firebaseAdmin;
  try {
    firebaseAdmin = getFirebaseAdmin();
  } catch (err) {
    console.error('Firebase init failed:', err.message);
    return res.status(503).json({ error: 'Firebase is not configured on the server' });
  }
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Firebase is not configured on the server' });
  }

  const { idToken } = req.body;
  let decoded;
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }

  const mobile = mobile10FromFirebasePhone(decoded.phone_number);
  if (!mobile) {
    return res.status(400).json({ error: 'Phone number missing from Firebase token' });
  }

  const user = await upsertVerifiedCitizen(mobile);
  const token = signUserToken(user);
  return res.json({ token, user: userToPublic(user) });
}

export const validateSetPassword = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export async function setPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  req.user.password_hash = hash;
  await req.user.save();
  return res.json({ message: 'Password saved', user: userToPublic(req.user) });
}

export const validateLogin = [
  body('mobile').trim().notEmpty(),
  body('password').notEmpty(),
];

export const validateCheckMobile = [body('mobile').trim().isLength({ min: 10, max: 15 })];

export async function checkMobile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const mobile = String(req.body.mobile || '').trim();
  const user = await User.findOne({ where: { mobile } });
  return res.json({
    exists: Boolean(user),
    has_password: Boolean(user?.password_hash),
  });
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { mobile, password } = req.body;

  if (
    dummyLoginAllowed() &&
    mobile === DUMMY_LOGIN_MOBILE &&
    password === DUMMY_LOGIN_PASSWORD
  ) {
    let user = await User.findOne({ where: { mobile: DUMMY_LOGIN_MOBILE } });
    const hash = await bcrypt.hash(DUMMY_LOGIN_PASSWORD, 10);
    if (!user) {
      user = await User.create({
        mobile: DUMMY_LOGIN_MOBILE,
        password_hash: hash,
        is_mobile_verified: true,
        ward_no: '42',
        city: 'Mumbai',
        role: 'citizen',
      });
    } else if (!user.password_hash || !(await bcrypt.compare(DUMMY_LOGIN_PASSWORD, user.password_hash))) {
      user.password_hash = hash;
      user.is_mobile_verified = true;
      await user.save();
    }
    const token = signUserToken(user);
    return res.json({ token, user: userToPublic(user) });
  }

  const user = await User.findOne({ where: { mobile } });
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signUserToken(user);
  return res.json({ token, user: userToPublic(user) });
}

export async function me(req, res) {
  return res.json({ user: userToPublic(req.user) });
}

async function upsertVerifiedCitizen(mobile) {
  let user = await User.findOne({ where: { mobile } });
  if (!user) {
    user = await User.create({
      mobile,
      is_mobile_verified: true,
      ward_no: '42',
      city: 'Mumbai',
      role: 'citizen',
    });
  } else {
    user.is_mobile_verified = true;
    await user.save();
  }
  return user;
}

function userToPublic(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    mobile: user.mobile,
    email: user.email,
    avatar_url: user.avatar_url,
    gender: user.gender,
    dob: user.dob,
    address: user.address,
    ward_no: user.ward_no,
    city: user.city,
    role: user.role,
    is_mobile_verified: user.is_mobile_verified,
    has_password: Boolean(user.password_hash),
  };
}
