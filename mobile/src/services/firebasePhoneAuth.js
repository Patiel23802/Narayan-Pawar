import Constants from 'expo-constants';

let authModule = null;

try {
  // Native module — only after prebuild + dev client / release APK (not Expo Go).
  // eslint-disable-next-line global-require
  authModule = require('@react-native-firebase/auth').default;
} catch {
  authModule = null;
}

function getOtpMode() {
  const fromExtra = Constants.expoConfig?.extra?.otpMode;
  const raw = fromExtra ?? process.env.EXPO_PUBLIC_OTP_MODE ?? 'firebase';
  return String(raw).trim().toLowerCase();
}

function firebasePhoneEnabledInConfig() {
  const fromExtra = Constants.expoConfig?.extra?.firebasePhone;
  if (fromExtra === false) return false;
  if (fromExtra === true) return true;
  const flag = process.env.EXPO_PUBLIC_FIREBASE_PHONE;
  if (flag === '0' || flag === 'false') return false;
  return flag === '1' || flag === 'true' || fromExtra === undefined;
}

/** App is configured for Firebase-only OTP (no backend /send-otp). */
export function isFirebaseOnlyOtpMode() {
  return getOtpMode() === 'firebase';
}

/** Dev-only: skip Play Integrity when google-services.json has no oauth_client yet. */
function applyFirebaseAuthTestSettings() {
  if (!authModule) return;
  const disable =
    process.env.EXPO_PUBLIC_FIREBASE_DISABLE_APP_VERIFICATION === '1' ||
    process.env.EXPO_PUBLIC_FIREBASE_DISABLE_APP_VERIFICATION === 'true';
  if (disable) {
    authModule().settings.appVerificationDisabledForTesting = true;
  }
}

applyFirebaseAuthTestSettings();

/** True when Firebase Phone Auth can run (config on + native module present). */
export function isFirebasePhoneAuthAvailable() {
  return firebasePhoneEnabledInConfig() && Boolean(authModule);
}

/**
 * Throws if the app is Firebase-only but the native module is missing (wrong build).
 * Call before send/verify OTP so we never silently fall back to backend DEV_OTP 123456.
 */
export function assertFirebaseOtpAvailable() {
  if (!isFirebaseOnlyOtpMode()) return;
  if (isFirebasePhoneAuthAvailable()) return;
  const missingNative = !authModule;
  throw new Error(
    missingNative
      ? 'Firebase Phone Auth is not in this APK. Run: npx expo prebuild --platform android --clean && npm run build:apk (not Expo Go).'
      : 'Firebase Phone Auth is disabled. Set EXPO_PUBLIC_FIREBASE_PHONE=1 and rebuild the APK.'
  );
}

/** Use Firebase for OTP when mode is firebase and native module exists. */
export function shouldUseFirebaseForOtp() {
  const mode = getOtpMode();
  if (mode === 'firebase') return isFirebasePhoneAuthAvailable();
  if (mode === 'backend') return false;
  if (process.env.EXPO_PUBLIC_PREFER_BACKEND_SMS === '1') return false;
  return isFirebasePhoneAuthAvailable();
}

export function toE164IndianMobile(mobile10) {
  const digits = String(mobile10 || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new Error('Enter a valid 10-digit mobile number');
  }
  return `+91${digits}`;
}

function mapFirebasePhoneError(err) {
  const code = err?.code || '';
  if (code === 'auth/missing-client-identifier') {
    return (
      'Firebase cannot verify this app. Add your APK SHA-1 in Firebase Console, re-download google-services.json, then: npx expo prebuild --platform android --clean && npm run build:apk'
    );
  }
  if (code === 'auth/app-not-authorized') {
    return 'This app is not authorized for Firebase Phone Auth. Check package com.civicpulse.nagarsevak and SHA fingerprints in Firebase Console.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'Wrong OTP. For Firebase test numbers use the exact code from Firebase Console (Authentication → Phone → test numbers).';
  }
  if (code === 'auth/code-expired' || code === 'auth/session-expired') {
    return 'OTP expired. Tap Resend OTP and try again.';
  }
  return err?.message || String(err);
}

export async function sendFirebasePhoneOtp(mobile10) {
  assertFirebaseOtpAvailable();
  const phone = toE164IndianMobile(mobile10);
  try {
    return await authModule().signInWithPhoneNumber(phone);
  } catch (err) {
    throw new Error(mapFirebasePhoneError(err));
  }
}

export async function confirmFirebasePhoneOtp(confirmation, code) {
  assertFirebaseOtpAvailable();
  if (!confirmation) {
    throw new Error('Request OTP first');
  }
  try {
    const credential = await confirmation.confirm(String(code).trim());
    const idToken = await credential.user.getIdToken();
    return { idToken, phoneNumber: credential.user.phoneNumber };
  } catch (err) {
    throw new Error(mapFirebasePhoneError(err));
  }
}

export function getFirebaseProjectHint() {
  return Constants.expoConfig?.extra?.firebaseProjectId || 'politics-c7b50';
}
