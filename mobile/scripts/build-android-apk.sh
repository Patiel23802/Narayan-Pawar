#!/usr/bin/env bash
# Builds a release APK for Android (Civic Pulse mobile app).
# Run from mobile/: npm run build:apk
# Output: android/app/build/outputs/apk/release/app-release.apk
#
# Prerequisite: generate native project once:
#   npx expo prebuild --platform android
#
# No Play Store keystore in this script; uses the default debug signing flow
# Expo/RN sets up for local release testing (sideload / internal QA).

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Check for Java (required for Gradle)
if ! command -v java &>/dev/null; then
  echo "Error: Java is not installed. Android build requires a Java Runtime." >&2
  echo "" >&2
  echo "Install Java 17 (recommended):" >&2
  echo "  brew install openjdk@17" >&2
  echo "  echo 'export PATH=\"/opt/homebrew/opt/openjdk@17/bin:\$PATH\"' >> ~/.zshrc" >&2
  echo "  source ~/.zshrc" >&2
  echo "" >&2
  echo "Then run: npm run build:apk" >&2
  exit 1
fi

if [ ! -f "google-services.json" ]; then
  echo "Error: mobile/google-services.json not found." >&2
  echo "Download from Firebase Console (politics-c7b50) after adding your SHA-1." >&2
  exit 1
fi

if [ ! -d "android" ]; then
  echo "Error: android/ folder not found." >&2
  echo "" >&2
  echo "Generate it once with Expo prebuild:" >&2
  echo "  cd mobile && npx expo prebuild --platform android" >&2
  echo "" >&2
  echo "Then run: npm run build:apk" >&2
  exit 1
fi

# Ensure Android SDK location is set (Gradle reads android/local.properties)
if [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME" ]; then
  ANDROID_SDK_ROOT="$ANDROID_HOME"
elif [ -d "$HOME/Android/Sdk" ]; then
  ANDROID_SDK_ROOT="$HOME/Android/Sdk"
elif [ -d "$HOME/Library/Android/sdk" ]; then
  ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
else
  ANDROID_SDK_ROOT="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
fi
if [ ! -d "$ANDROID_SDK_ROOT" ]; then
  echo "Error: Android SDK not found at: $ANDROID_SDK_ROOT" >&2
  echo "" >&2
  echo "Install the Android SDK (Android Studio → SDK Manager), then set:" >&2
  echo "  export ANDROID_HOME=\$HOME/Library/Android/sdk   # macOS" >&2
  echo "  export ANDROID_HOME=\$HOME/Android/Sdk           # Linux" >&2
  echo "  export PATH=\$ANDROID_HOME/platform-tools:\$PATH" >&2
  exit 1
fi

LOCAL_PROPERTIES="$PROJECT_ROOT/android/local.properties"
echo "sdk.dir=$ANDROID_SDK_ROOT" > "$LOCAL_PROPERTIES"

# React Native 0.81+ ships "hermes" in osx-bin but the build expects "hermesc".
HERMES_OSX_BIN="$PROJECT_ROOT/node_modules/react-native/sdks/hermesc/osx-bin"
if [ -d "$HERMES_OSX_BIN" ] && [ -f "$HERMES_OSX_BIN/hermes" ] && [ ! -f "$HERMES_OSX_BIN/hermesc" ]; then
  ln -sf hermes "$HERMES_OSX_BIN/hermesc"
  echo "Created hermesc symlink for macOS build."
fi

if [[ "$(uname -s)" == "Darwin" ]] && [ -d "$HERMES_OSX_BIN" ]; then
  xattr -cr "$HERMES_OSX_BIN" 2>/dev/null || true
fi

echo "Building Android release APK..."
echo "OTP mode: ${EXPO_PUBLIC_OTP_MODE:-firebase} (from .env; also baked via app.config.js extra)"
if [ "${EXPO_PUBLIC_OTP_MODE:-firebase}" = "firebase" ]; then
  echo "Firebase-only: run 'npx expo prebuild --platform android --clean' after google-services.json changes."
fi
echo "Using single ABI (arm64-v8a) to reduce memory use during Hermes compile."

# Autolinking stores absolute paths to node_modules. If the project folder was moved or
# renamed, a stale cache makes Gradle point at missing dirs -> "No matching variant" /
# "No variants exist" for react-native-* libraries.
echo "Clearing Android autolinking / CMake caches that embed absolute paths..."
rm -rf "$PROJECT_ROOT/android/build/generated/autolinking"
rm -rf "$PROJECT_ROOT/android/app/.cxx"

cd android
./gradlew --stop 2>/dev/null || true
# Metro-copied drawables under app/build/generated can go stale; clean app module so image requires rebundle.
echo "Cleaning :app outputs so bundled assets (e.g. require('*.png')) match current files..."
./gradlew :app:clean
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
cd "$PROJECT_ROOT"

APK_PATH="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  echo ""
  echo "Done. APK created at:"
  echo "  $APK_PATH"
  echo ""
  if [ -f "$PROJECT_ROOT/scripts/verify-firebase-android.sh" ]; then
    bash "$PROJECT_ROOT/scripts/verify-firebase-android.sh" || true
  fi
else
  echo "Error: APK was not created at expected path." >&2
  exit 1
fi
