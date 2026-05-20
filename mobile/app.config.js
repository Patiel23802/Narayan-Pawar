/**
 * Merges Expo config from app.json. Set EXPO_PUBLIC_API_URL before `eas build` or
 * `expo start` so packaged builds hit your deployed API (same scheme+host used for /admin in browser).
 */
module.exports = ({ config }) => {
  const trimmed =
    typeof process.env.EXPO_PUBLIC_API_URL === 'string'
      ? process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/$/, '')
      : '';

  const apiUrl =
    trimmed ||
    (config.extra?.apiUrl && String(config.extra.apiUrl).trim()) ||
    'https://139-59-5-79.sslip.io';

  const plugins = [...(config.plugins || [])];
  if (!plugins.some((p) => p === '@react-native-firebase/app' || p?.[0] === '@react-native-firebase/app')) {
    plugins.push('@react-native-firebase/app');
  }
  if (!plugins.some((p) => p === '@react-native-firebase/auth' || p?.[0] === '@react-native-firebase/auth')) {
    plugins.push('@react-native-firebase/auth');
  }
  if (!plugins.some((p) => p?.[0] === 'expo-build-properties')) {
    plugins.push([
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBAuth'],
        },
      },
    ]);
  }

  const otpMode = String(process.env.EXPO_PUBLIC_OTP_MODE || 'firebase').toLowerCase();
  const firebasePhone =
    process.env.EXPO_PUBLIC_FIREBASE_PHONE !== '0' &&
    process.env.EXPO_PUBLIC_FIREBASE_PHONE !== 'false';

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      apiUrl,
      /** Baked into release APK — do not rely on .env alone at Gradle bundle time. */
      otpMode,
      firebasePhone,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'politics-c7b50',
    },
  };
};
