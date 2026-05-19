import Constants from 'expo-constants';

let authModule = null;

try {
  // Native module — only after prebuild + dev client / release APK (not Expo Go).
  // eslint-disable-next-line global-require
  authModule = require('@react-native-firebase/auth').default;
} catch {
  authModule = null;
}

function firebasePhoneEnabledInConfig() {
  const flag = process.env.EXPO_PUBLIC_FIREBASE_PHONE;
  if (flag === '0' || flag === 'false') return false;
  return flag === '1' || flag === 'true';
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

/** True when Firebase Phone Auth should be used (config on + native module present). */
export function isFirebasePhoneAuthAvailable() {
  return firebasePhoneEnabledInConfig() && Boolean(authModule);
}

export function toE164IndianMobile(mobile10) {
  const digits = String(mobile10 || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new Error('Enter a valid 10-digit mobile number');
  }
  return `+91${digits}`;
}

/**
 * Firebase sends the SMS. Returns a confirmation object — call confirmPhoneOtp with the 6-digit code.
 */
function mapFirebasePhoneError(err) {
  const code = err?.code || '';
  if (code === 'auth/missing-client-identifier') {
    return (
      'Firebase cannot verify this app. Your google-services.json still has empty oauth_client. ' +
      'In Google Cloud Console create an Android OAuth client (package com.civicpulse.nagarsevak + your SHA-1), ' +
      'enable Phone + Google sign-in in Firebase Authentication, re-download google-services.json, then rebuild the APK.'
    );
  }
  if (code === 'auth/app-not-authorized') {
    return 'This app is not authorized for Firebase Phone Auth. Check package name com.civicpulse.nagarsevak and SHA fingerprints in Firebase Console.';
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
  if (!isFirebasePhoneAuthAvailable()) {
    throw new Error(
      'Firebase SMS is not available. Rebuild the app with google-services.json and EXPO_PUBLIC_FIREBASE_PHONE=1.'
    );
  }
  const phone = toE164IndianMobile(mobile10);
  try {
    return await authModule().signInWithPhoneNumber(phone);
  } catch (err) {
    throw new Error(mapFirebasePhoneError(err));
  }
}

export async function confirmFirebasePhoneOtp(confirmation, code) {
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
  return Constants.expoConfig?.extra?.firebaseProjectId || null;
}
