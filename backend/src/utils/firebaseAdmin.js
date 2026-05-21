import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let initialized = false;
let initError = null;

function parseServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (saPath) {
    const resolved = path.isAbsolute(saPath) ? saPath : path.resolve(process.cwd(), saPath);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }

  const defaultPaths = [
    path.resolve(process.cwd(), 'secrets/firebase-service-account.json'),
    path.resolve(__dirname, '../../secrets/firebase-service-account.json'),
  ];

  for (const candidate of defaultPaths) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    }
  }

  // Any *firebase-adminsdk*.json dropped in backend/secrets/ (e.g. from Firebase Console download).
  for (const secretsDir of [
    path.resolve(process.cwd(), 'secrets'),
    path.resolve(__dirname, '../../secrets'),
  ]) {
    if (!fs.existsSync(secretsDir)) continue;
    const match = fs
      .readdirSync(secretsDir)
      .find((name) => name.includes('firebase-adminsdk') && name.endsWith('.json'));
    if (match) {
      return JSON.parse(fs.readFileSync(path.join(secretsDir, match), 'utf8'));
    }
  }

  return null;
}

function ensureInitialized() {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return admin;
  }

  try {
    const serviceAccount = parseServiceAccountFromEnv();
    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else {
      throw new Error(
        'No Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, or GOOGLE_APPLICATION_CREDENTIALS.'
      );
    }
    initialized = true;
    initError = null;
    return admin;
  } catch (err) {
    initError = err;
    initialized = false;
    throw err;
  }
}

export function isFirebaseConfigured() {
  try {
    if (initialized || admin.apps.length > 0) return true;
    return Boolean(parseServiceAccountFromEnv()) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  } catch {
    return false;
  }
}

export function getFirebaseAdmin() {
  if (!isFirebaseConfigured()) return null;
  try {
    return ensureInitialized();
  } catch (err) {
    console.error('Firebase init failed:', err.message);
    return null;
  }
}

export async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Firebase ID token is required');
  }
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    throw new Error(
      initError ? initError.message : 'Firebase is not configured on the server'
    );
  }
  return firebaseAdmin.auth().verifyIdToken(idToken, true);
}

/** Firebase phone claims are E.164 (+91XXXXXXXXXX); store 10-digit mobile in DB. */
export function mobile10FromFirebasePhone(phoneNumber) {
  if (!phoneNumber) return null;
  const digits = String(phoneNumber).replace(/\D/g, '');
  const ten = digits.slice(-10);
  return ten.length === 10 ? ten : null;
}

export function normalizeMobile10(input) {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, '');
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  return ten.length === 10 ? ten : null;
}
