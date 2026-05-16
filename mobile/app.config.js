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

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      apiUrl,
    },
  };
};
