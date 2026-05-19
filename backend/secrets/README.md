# Server secrets (not committed)

Place your Firebase Admin SDK JSON here:

```
firebase-service-account.json
```

Download from Firebase Console → **politics-c7b50** → Project settings → Service accounts → **Generate new private key**.

Then restart the API:

```bash
cd "/root/Narayan Pawar"
docker-compose up -d --build api
```

Verify:

```bash
curl -sS https://139-59-5-79.sslip.io/api/auth/otp-config
# firebase_configured should be true
```
