import { Router } from 'express';
import {
  sendOtp,
  otpConfig,
  verifyOtp,
  setPassword,
  login,
  checkMobile,
  me,
  validateSendOtp,
  validateVerifyOtp,
  validateSetPassword,
  validateLogin,
  validateCheckMobile,
  validateFirebasePhone,
  verifyFirebasePhone,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const firebasePhoneLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_FIREBASE_PHONE_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_FIREBASE_PHONE_MAX || 30),
  keyFn: (req) => {
    const mobile = String(req.body?.mobile || req.body?.phone || '').replace(/\D/g, '').slice(-10);
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return mobile ? `${ip}|${mobile}` : ip;
  },
});

const r = Router();
r.get('/otp-config', otpConfig);
r.post('/send-otp', validateSendOtp, sendOtp);
r.post('/verify-otp', validateVerifyOtp, verifyOtp);
r.post('/firebase-phone', firebasePhoneLimiter, validateFirebasePhone, verifyFirebasePhone);
r.post('/verify-firebase-otp', firebasePhoneLimiter, validateFirebasePhone, verifyFirebasePhone);
r.post('/set-password', requireAuth(), validateSetPassword, setPassword);
r.post('/login', validateLogin, login);
r.post('/check-mobile', validateCheckMobile, checkMobile);
r.get('/me', requireAuth(), me);

export default r;
