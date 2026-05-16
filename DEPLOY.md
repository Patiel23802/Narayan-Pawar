# Remote deployment (Civic Pulse)

Your repo is already set up for production-style hosting: **PostgreSQL + API + admin (nginx)** in one Docker Compose stack. Remote deployment means running that stack on a machine with a public IP or DNS name, then pointing the mobile app at the same public URL.

## 1. Choose a server

Any **Linux VPS** works (Ubuntu 22.04 LTS is a common choice): DigitalOcean, Linode, Akamai Lumen, Hetzner, AWS Lightsail, etc. Pick a region close to your users.

Minimum sensible sizing to start: **2 GB RAM** (Postgres + Node + nginx).

## 2. DNS

Create an **A record** for your hostname (e.g. `civic.yourdomain.com`) pointing at the server’s public IPv4 (and AAAA for IPv6 if you use it).

## 3. Install Docker on the server

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME:-$VERSION_ID}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in so `docker` works without `sudo`.

## 4. Put the code on the server

Either **git clone** your repository or **rsync** the project directory (without `node_modules` if you want a smaller transfer).

## 5. Configure environment

From the project root (same folder as `docker-compose.yml`):

```bash
cp docker.env.example .env
```

Edit `.env` and set at least:

| Variable | Notes |
|----------|--------|
| `JWT_SECRET` | Long random string, e.g. `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Strong password (not the default `postgres` in production) |

Optional:

| Variable | Notes |
|----------|--------|
| `JWT_EXPIRES_IN` | Default `7d` |
| `CORS_ORIGIN` | If the browser admin is ever on a **different origin** than the API, set a comma-separated list of allowed origins. Same host via nginx usually needs `*` or unset. |

## 6. Bind nginx + API to localhost (recommended before TLS)

So the only public entry is Caddy (or another edge proxy), set in `.env`:

```env
WEB_PORT=127.0.0.1:8080
API_PUBLISH_PORT=127.0.0.1:4000
```

The mobile app and browsers still use `https://your-domain` (port 443); they do not need `:8080` or `:4000`.

## 7. Start the stack

```bash
docker-compose up -d --build
docker-compose exec api npm run seed
```

The last line is optional; it loads demo data (including the seeded representative name). Skip it if you want an empty production database.

Health checks:

- Through nginx + Caddy (after TLS, step 8): `https://your-domain/health`
- API direct on loopback (on the server): `curl -sS http://127.0.0.1:4000/health`

## 8. HTTPS with Caddy (TLS in front of nginx + Express)

1. Install [Caddy](https://caddyserver.com/docs/install) on the host (apt package or official repo).
2. Configure **`/etc/caddy/Caddyfile`** so Caddy terminates TLS and **reverse_proxies everything** to **`127.0.0.1:8080`** (Docker nginx, which serves the admin SPA and proxies `/api/*` and `/uploads/*` to Express). See `deploy/Caddyfile.example`.
3. Keep **`WEB_PORT=127.0.0.1:8080`** and **`API_PUBLISH_PORT=127.0.0.1:4000`** in `.env` so neither nginx nor Express listens on the public interface.
4. `sudo systemctl enable --now caddy` and **`sudo systemctl restart caddy`** after changing the site block or upstream.

Open **https://your-domain/** for the admin SPA; **`/api/*`** and **`/uploads/*`** are proxied by **nginx** to Express (same as `admin/nginx/default.conf` in the repo).

## 9. Firewall

Allow **22** (SSH), **80**, and **443** only if you use Caddy on the host. Do **not** expose Postgres (`5432`) publicly.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 10. Mobile app (Expo)

Production builds must know the public API origin (same as the URL users type in the browser, no path):

```env
EXPO_PUBLIC_API_URL=https://your-domain
```

For EAS builds, set `EXPO_PUBLIC_API_URL` in **EAS Environment** (project secrets), then rebuild.

## 11. Operations

- **Logs:** `docker-compose logs -f api` (and `web`, `db`). Use `journalctl -u caddy -f` for Caddy.
- **Updates:** `git pull` (or rsync), then `docker-compose up -d --build` from the project root.
- **Backups:** Persist volume `pgdata`; schedule `pg_dump` or volume snapshots on your provider.

## 12. This droplet (**nginx + Express**, Caddy for TLS)

**Docker Compose** runs **Postgres**, **Express (`api`)**, and **nginx (`web`)** with the built admin. nginx proxies **`/api/*`**, **`/uploads/*`**, and **`/health`** to the API container (see `admin/nginx/default.conf`).

**Caddy** on the host terminates HTTPS and reverse-proxies to **`127.0.0.1:8080`** (nginx only). Express stays on **`127.0.0.1:4000`** (not exposed publicly).

- **`/etc/caddy/Caddyfile`** — site `139-59-5-79.sslip.io` → `reverse_proxy 127.0.0.1:8080`. Update the hostname if the droplet IP or domain changes; then **`sudo systemctl restart caddy`**.
- **`.env`:** `WEB_PORT=127.0.0.1:8080`, `API_PUBLISH_PORT=127.0.0.1:4000`.
- **Public URL:** `https://139-59-5-79.sslip.io`
- **UFW:** OpenSSH, 80, 443.

After admin UI changes, rebuild the stack (nginx image includes the SPA):

```bash
cd /path/to/repo && docker-compose up -d --build web
```

**Alternative (no Docker nginx for admin):** Caddy can route `/api` to Express and `file_server` for static files — see `deploy/Caddyfile.caddy-express.example` (not the default for this project).

Mobile / EAS:

```env
EXPO_PUBLIC_API_URL=https://139-59-5-79.sslip.io
```

## Alternative: PaaS without Docker Compose

If you prefer a managed platform (Railway, Render, Fly.io, etc.), you must provide **managed PostgreSQL** and run the **API** from `backend/Dockerfile`. The **admin** is then static files plus a reverse proxy (or your own Caddy-equivalent) for `/api` and `/uploads`.
