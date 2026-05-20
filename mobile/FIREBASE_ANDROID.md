# Firebase Phone Auth on Android (local APK)

## Error: `auth/missing-client-identifier`

This is **not** only a missing SHA in the JSON file. Firebase checks:

1. **SHA-1 and SHA-256** on the Android app in Firebase Console (both required for RN Firebase)
2. **Fresh** `google-services.json` with non-empty `oauth_client` → `certificate_hash`
3. **Same certificate** used to sign the APK you install
4. **Phone** sign-in enabled (Authentication → Sign-in method)
5. **Blaze** billing for real SMS (India)

Sideloaded APKs (not from Play Store) often fail **Play Integrity**; Firebase then uses **reCAPTCHA**. If SHA/certs are wrong, both fail → this error.

## Fix checklist (Mac)

```bash
cd mobile
bash scripts/print-android-sha.sh
```

1. [Firebase Console](https://console.firebase.google.com/) → **politics-c7b50** → ⚙️ Project settings → Your apps → Android  
2. **Add fingerprint** → paste **SHA-1** and **SHA-256** from the script (not only one).  
3. **Download** `google-services.json` → replace `mobile/google-services.json`.  
4. Open the file and confirm `oauth_client` contains `certificate_hash` (40 hex chars).  
5. Authentication → **Phone** → Enable.  
6. [Google Cloud Console](https://console.cloud.google.com/) → same project → **APIs & Services** → enable:
   - Identity Toolkit API  
   - Android Device Verification API (if listed)  
7. Rebuild:

```bash
npx expo prebuild --platform android --clean
npm run build:apk
bash scripts/verify-firebase-android.sh   # must say OK: APK SHA-1 matches
```

8. Uninstall old app → install new APK.

## Verify APK cert (important)

```bash
keytool -printcert -jarfile android/app/build/outputs/apk/release/app-release.apk | grep SHA1
```

Must match `certificate_hash` in `google-services.json` (ignore colons, lowercase).

## Temporary testing (Firebase test numbers)

In `mobile/.env`:

```
EXPO_PUBLIC_FIREBASE_DISABLE_APP_VERIFICATION=1
```

Add test numbers in Firebase → Authentication → Phone → **Phone numbers for testing**.  
Rebuild APK. Real SMS may still need Blaze + correct SHA for production.

## Server after OTP

Place `firebase-service-account.json` in `backend/secrets/` on the VPS and set `OTP_AUTH_MODE=firebase`.
