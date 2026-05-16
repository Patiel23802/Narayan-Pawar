import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import { LocaleProvider } from '../src/context/LocaleContext';
import { AuthProvider } from '../src/context/AuthContext';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });

  if (__DEV__ && fontError) {
    console.warn('[RootLayout] Font load failed, continuing with system fallback:', fontError?.message);
  }

  if (!loaded && !fontError) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="password-setup" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="dark" />
          </AuthProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
