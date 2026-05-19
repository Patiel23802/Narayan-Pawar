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

const r = Router();
r.get('/otp-config', otpConfig);
r.post('/send-otp', validateSendOtp, sendOtp);
r.post('/verify-otp', validateVerifyOtp, verifyOtp);
r.post('/firebase-phone', validateFirebasePhone, verifyFirebasePhone);
r.post('/set-password', requireAuth(), validateSetPassword, setPassword);
r.post('/login', validateLogin, login);
r.post('/check-mobile', validateCheckMobile, checkMobile);
r.get('/me', requireAuth(), me);

export default r;
