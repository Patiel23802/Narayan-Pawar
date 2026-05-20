#!/usr/bin/env bash
# Compare Firebase google-services.json SHA with keystores and the built release APK.
# Run from mobile/: bash scripts/verify-firebase-android.sh

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

GS_JSON="$PROJECT_ROOT/google-services.json"
APK="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"

hash_from_json() {
  python3 - <<'PY' "$GS_JSON" 2>/dev/null || true
import json, sys
path = sys.argv[1]
with open(path) as f:
    data = json.load(f)
for client in data.get("client", []):
    for oauth in client.get("oauth_client", []):
        info = oauth.get("android_info") or {}
        h = info.get("certificate_hash")
        if h:
            print(h.lower())
PY
}

normalize_sha1() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d ':'
}

EXPECTED="$(hash_from_json)"
echo "Firebase project: politics-c7b50"
echo "Package:          com.civicpulse.nagarsevak"
echo ""
echo "google-services.json certificate_hash: ${EXPECTED:-NOT FOUND}"
echo ""

if [ ! -f "$GS_JSON" ]; then
  echo "Missing $GS_JSON" >&2
  exit 1
fi

if [ -f "$PROJECT_ROOT/android/app/google-services.json" ]; then
  NATIVE_HASH="$(python3 - <<'PY' "$PROJECT_ROOT/android/app/google-services.json"
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for client in data.get("client", []):
    for oauth in client.get("oauth_client", []):
        h = (oauth.get("android_info") or {}).get("certificate_hash")
        if h:
            print(h.lower())
PY
)"
  echo "android/app/google-services.json hash: ${NATIVE_HASH:-NOT FOUND}"
  if [ -n "$EXPECTED" ] && [ -n "$NATIVE_HASH" ] && [ "$EXPECTED" != "$NATIVE_HASH" ]; then
    echo "WARN: native copy differs from mobile/google-services.json — run prebuild --clean"
  fi
else
  echo "WARN: android/app/google-services.json missing — run: npx expo prebuild --platform android --clean"
fi

echo ""
bash "$PROJECT_ROOT/scripts/print-android-sha.sh" | tail -n +1

if [ -f "$APK" ]; then
  echo ""
  echo "=== Release APK signing cert ($APK) ==="
  if command -v apksigner &>/dev/null; then
    apksigner verify --print-certs "$APK" 2>/dev/null | awk '/Signer #1 certificate SHA-1:|Signer #1 certificate SHA-256:/ { print }'
    APK_SHA1="$(apksigner verify --print-certs "$APK" 2>/dev/null | awk -F': ' '/SHA-1 digest:/ {print $2}' | head -1 | tr -d ':')"
  else
    # jarsigner / keytool fallback
    APK_SHA1="$(keytool -printcert -jarfile "$APK" 2>/dev/null | awk -F': ' '/SHA1:/ {print $2}' | head -1 | tr -d ':')"
    keytool -printcert -jarfile "$APK" 2>/dev/null | awk '/SHA1:|SHA256:/ { print }' || true
  fi
  APK_SHA1_NORM="$(normalize_sha1 "$APK_SHA1")"
  if [ -n "$EXPECTED" ] && [ -n "$APK_SHA1_NORM" ]; then
    echo ""
    if [ "$EXPECTED" = "$APK_SHA1_NORM" ]; then
      echo "OK: APK SHA-1 matches google-services.json"
    else
      echo "MISMATCH: APK SHA-1 ($APK_SHA1_NORM) != google-services ($EXPECTED)"
      echo "Add the APK SHA-1 in Firebase Console, re-download google-services.json, prebuild --clean, rebuild."
    fi
  fi
else
  echo ""
  echo "No release APK yet. Build first: npm run build:apk"
fi
