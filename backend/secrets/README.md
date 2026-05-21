# Server secrets (not committed)

## Firebase-only OTP

Place your Firebase Admin SDK JSON here (either name works):

```
firebase-service-account.json
```

or the file downloaded from Firebase Console, e.g. `politics-c7b50-firebase-adminsdk-….json`.

**Do not commit this JSON to GitHub** — it is ignored by `.gitignore`. Copy it to the server `backend/secrets/` folder (or set `FIREBASE_SERVICE_ACCOUNT_PATH`) when deploying.

Download from Firebase Console → **politics-c7b50** → Project settings → Service accounts → **Generate new private key**.

Root `.env` should include:

```
OTP_AUTH_MODE=firebase
FIREBASE_PROJECT_ID=politics-c7b50
```

Then restart the API:

```bash
cd "/root/Narayan Pawar"
docker-compose up -d api
```

Verify:

```bash
curl -sS https://139-59-5-79.sslip.io/api/auth/otp-config
# otp_auth_mode: "firebase", firebase_configured: true
```

With `OTP_AUTH_MODE=firebase`, `/api/auth/send-otp` is disabled and dev OTP `123456` no longer works — only Firebase SMS on the phone app.
