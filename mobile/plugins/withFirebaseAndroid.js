const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');

const PACKAGE = 'com.civicpulse.nagarsevak';

/** Copy google-services.json into android/app (fixes stale/empty oauth_client in native build). */
function withGoogleServicesFile(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const src = path.join(projectRoot, 'google-services.json');
      const destDir = path.join(projectRoot, 'android', 'app');
      const dest = path.join(destDir, 'google-services.json');

      if (!fs.existsSync(src)) {
        throw new Error(
          'mobile/google-services.json is missing. Download it from Firebase Console (politics-c7b50) after adding SHA-1 and SHA-256.'
        );
      }

      const raw = fs.readFileSync(src, 'utf8');
      const json = JSON.parse(raw);
      const clients = json.client || [];
      const androidClient = clients.find(
        (c) => c.client_info?.android_client_info?.package_name === PACKAGE
      );
      const oauth = androidClient?.oauth_client || [];
      const hasAndroidOauth = oauth.some(
        (o) => o.client_type === 1 && o.android_info?.certificate_hash
      );
      if (!hasAndroidOauth) {
        throw new Error(
          'google-services.json has no Android oauth_client with certificate_hash. In Firebase Console add SHA-1 AND SHA-256, then re-download google-services.json.'
        );
      }

      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
      return mod;
    },
  ]);
}

/** Release APK must use debug keystore so cert matches Firebase SHA (local npm run build:apk). */
function withReleaseUsesDebugSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let src = mod.modResults.contents;

    if (!/release\s*\{[^}]*signingConfig\s+signingConfigs\.debug/s.test(src)) {
      if (src.includes('release {')) {
        src = src.replace(/(\n\s*release\s*\{)/, '$1\n            signingConfig signingConfigs.debug');
      } else if (src.includes('buildTypes {')) {
        src = src.replace(
          /buildTypes\s*\{/,
          'buildTypes {\n        release {\n            signingConfig signingConfigs.debug\n        }'
        );
      }
    }

    mod.modResults.contents = src;
    return mod;
  });
}

/**
 * Expo config plugin: Firebase Phone Auth prerequisites for Android local release builds.
 */
function withFirebaseAndroid(config) {
  config = withGoogleServicesFile(config);
  config = withReleaseUsesDebugSigning(config);
  config = AndroidConfig.GoogleServices.withGoogleServicesFile(config);
  return config;
}

module.exports = withFirebaseAndroid;
