import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/constants/theme';

export default function Index() {
  const { token, user, booting } = useAuth();

  if (booting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/(auth)/sign-up" />;
  }

  if (token && user && !user.has_password) {
    return <Redirect href="/password-setup" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
