const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Local release APKs from `npm run build:apk` must use the same cert as
 * ~/.android/debug.keystore (the SHA registered in Firebase). Expo/RN release
 * builds often omit this and cause auth/missing-client-identifier.
 */
function withAndroidReleaseDebugSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let src = mod.modResults.contents;
    if (src.includes('signingConfig signingConfigs.debug') && /release\s*\{[\s\S]*?signingConfig signingConfigs\.debug/.test(src)) {
      return mod;
    }
    if (src.includes('release {')) {
      src = src.replace(/(\n\s*release\s*\{)/, '$1\n            signingConfig signingConfigs.debug');
    }
    mod.modResults.contents = src;
    return mod;
  });
}

module.exports = withAndroidReleaseDebugSigning;
