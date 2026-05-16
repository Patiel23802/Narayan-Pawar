# The Civic Pulse / Nagarsevak

Full-stack civic engagement app for Ward 42: React Native (Expo) mobile client, Node.js + Express + Sequelize + PostgreSQL API.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (database `civic_pulse`, or set `DATABASE_URL`)

### `role "postgres" does not exist` (common on macOS Homebrew)

Homebrew’s PostgreSQL often has **no** database user named `postgres`. The superuser is usually **your macOS username** (run `whoami`).

1. Create the database (from a terminal):

   ```bash
   createdb civic_pulse
   ```

2. In `backend/.env`, set `DATABASE_URL` to use your user and **no password** for local trust auth, for example:

   ```env
   DATABASE_URL=postgres://YOUR_MAC_USERNAME@localhost:5432/civic_pulse
   ```

   Replace `YOUR_MAC_USERNAME` with the output of `whoami`.

If you omit `DATABASE_URL` entirely, the app falls back to `postgres://$USER@localhost:5432/civic_pulse` (your shell `USER`).

## Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL (see above on Mac) and JWT_SECRET
npm install
npm run seed   # sample data: Narayan Pawar, projects, complaints, emergency contacts
npm run dev    # http://localhost:4000
```

Health check: `GET http://localhost:4000/health`

### Dev OTP

`DEV_OTP` defaults to `123456` (see `.env.example`). `POST /api/auth/send-otp` stores this value for verification.

### Seeded logins (after `npm run seed`)

- Demo citizen: mobile `9876543210`, password `demo1234`
- Admin: mobile `9999999999`, password `admin123`

### API base URL on devices

`mobile/app.config.js` sets `extra.apiUrl` from `EXPO_PUBLIC_API_URL` first, then `app.json`, then localhost.

- Local iOS Simulator: defaults to loopback (`app.json`).
- Android Emulator: override with `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`.
- LAN device: point at your dev machine IP, e.g. `http://192.168.1.10:4000`.
- **Production / deployed API:** set `EXPO_PUBLIC_API_URL` to the public origin of your Docker host (scheme + hostname + optional nonstandard port — no path, no trailing slash). Example: `https://yourdomain.com`.

## Mobile setup

```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` when starting Expo if you override the API host:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 npx expo start
```

## Admin (local)

```bash
cd admin
cp .env.example .env    # defaults to http://localhost:4000
npm install && npm run dev
```

Production on a VPS is **nginx + Express** in Docker (nginx serves the admin build and proxies `/api` and `/uploads` to Express). **Caddy** on the host is optional but recommended for automatic HTTPS: it only reverse-proxies to nginx on loopback. See [DEPLOY.md](./DEPLOY.md) and `deploy/Caddyfile.example`.

From the repo root:

```bash
cp docker.env.example .env
# Set JWT_SECRET in .env — use a strong random string.
docker-compose up -d --build
docker-compose exec api npm run seed   # optional: demo users / data
```

- **Browser admin + API (via nginx):** `https://YOUR_DOMAIN/` when Caddy fronts nginx, or `http://YOUR_HOST/` if you expose `WEB_PORT` directly (not recommended without TLS).
- **API on loopback:** `API_PUBLISH_PORT=127.0.0.1:4000` when using Caddy → nginx (see `docker.env.example`).

Point the mobile app at the same **public origin** as users open in the browser (HTTPS URL if using Caddy):

```bash
cd mobile
echo 'EXPO_PUBLIC_API_URL=https://YOUR_DOMAIN' >> .env   # no trailing path; no trailing slash preferred
```

For `eas build`, add `EXPO_PUBLIC_API_URL` in **EAS Environment** so release builds hit prod.

## Project layout

- `backend/` — Express API, Sequelize models, JWT auth, Multer uploads under `src/uploads`
- `admin/` — Vite/React ward admin UI
- `mobile/` — Expo app (`App.js`, `src/screens`, `src/components`, `src/i18n` for Marathi / Hindi / English)

## License

Private / ward project — adjust as needed.
