#!/usr/bin/env bash
# Optional: publish admin static files for a Caddy-only edge (see deploy/Caddyfile.caddy-express.example).
# Default production uses Docker nginx (`web` service) — rebuild with: docker-compose up -d --build web
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_ROOT="${STATIC_ROOT:-/var/www/narayan-pawar-admin}"
IMAGE_TAG="${IMAGE_TAG:-np-admin-static-publish}"

docker build -t "$IMAGE_TAG" -f "$ROOT/admin/Dockerfile" "$ROOT/admin"
cid="$(docker create "$IMAGE_TAG")"
trap 'docker rm -f "$cid" >/dev/null 2>&1 || true' EXIT
mkdir -p "$STATIC_ROOT"
rm -rf "${STATIC_ROOT:?}/"*
docker cp "$cid:/usr/share/nginx/html/." "$STATIC_ROOT/"
if id caddy &>/dev/null; then
	chown -R caddy:caddy "$STATIC_ROOT"
fi
echo "Published admin static files to $STATIC_ROOT"
echo "Reload Caddy: sudo systemctl reload caddy   (or restart if routes changed)"
