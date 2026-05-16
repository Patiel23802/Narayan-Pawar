import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let initialized = false;

export function isFirebaseConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim());
}

export function getFirebaseAdmin() {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!saPath) return null;

  if (!initialized) {
    const resolved = path.isAbsolute(saPath) ? saPath : path.resolve(process.cwd(), saPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Firebase service account not found: ${resolved}`);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  }
  return admin;
}

/** Firebase phone claims are E.164 (+91XXXXXXXXXX); store 10-digit mobile in DB. */
export function mobile10FromFirebasePhone(phoneNumber) {
  if (!phoneNumber) return null;
  const digits = String(phoneNumber).replace(/\D/g, '');
  const ten = digits.slice(-10);
  return ten.length === 10 ? ten : null;
}
