#!/usr/bin/env bash
# Print SHA-1 and SHA-256 for Firebase Console → Project settings → Your Android app → Add fingerprint.
# Usage: bash scripts/print-android-sha.sh
# After adding fingerprints, re-download google-services.json from Firebase and rebuild the APK.

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

print_keystore() {
  local label="$1"
  local keystore="$2"
  local alias="${3:-androiddebugkey}"
  local storepass="${4:-android}"

  if [ ! -f "$keystore" ]; then
    echo "[$label] Keystore not found: $keystore"
    return
  fi

  echo ""
  echo "=== $label ==="
  echo "Keystore: $keystore"
  keytool -list -v -keystore "$keystore" -alias "$alias" -storepass "$storepass" 2>/dev/null \
    | awk '/SHA1:|SHA256:/ { print }' || {
    echo "Could not read keystore (wrong alias/password or keytool missing)."
  }
}

if ! command -v keytool &>/dev/null; then
  echo "Error: keytool not found. Install Java (JDK 17+) and retry." >&2
  exit 1
fi

echo "Firebase project: politics-c7b50"
echo "Android package:  com.civicpulse.nagarsevak"
echo ""
echo "Add BOTH SHA-1 and SHA-256 in Firebase Console, then re-download google-services.json."

# Expo / React Native default debug keystore (after prebuild or local android debug builds)
DEBUG_KS="$HOME/.android/debug.keystore"
print_keystore "Debug (default ~/.android/debug.keystore)" "$DEBUG_KS" "androiddebugkey" "android"

# Release keystore used by this project (if you created one for sideload/Play Store)
RELEASE_KS="$PROJECT_ROOT/android/app/release.keystore"
if [ -f "$RELEASE_KS" ]; then
  echo ""
  echo "Release keystore found. If you use a custom password/alias, run keytool manually:"
  echo "  keytool -list -v -keystore android/app/release.keystore -alias YOUR_ALIAS"
  print_keystore "Release (android/app/release.keystore)" "$RELEASE_KS" "civicpulse" "changeme" 2>/dev/null || true
fi

echo ""
echo "Next steps:"
echo "  1. Firebase Console → politics-c7b50 → Project settings → Your apps → Android"
echo "  2. Add fingerprint (paste SHA-1 and SHA-256 from above)"
echo "  3. Download new google-services.json → replace mobile/google-services.json"
echo "  4. Rebuild: npx expo prebuild --platform android --clean && npm run build:apk"
echo ""
echo "If Firebase still says 'cannot verify this app', run after build:"
echo "  bash scripts/verify-firebase-android.sh"
echo "The APK SHA-1 must match certificate_hash in google-services.json."
