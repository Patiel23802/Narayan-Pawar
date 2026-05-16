import React from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { useNavigation } from '@react-navigation/native';

export function ScreenHeader({ title, navigation, right }) {
  const nav = useNavigation();
  const resolvedNav = navigation ?? nav;
  const { fonts } = useLocale();
  const canGoBack = resolvedNav?.canGoBack?.();
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.row}>
        {canGoBack ? (
          <Pressable onPress={() => resolvedNav.goBack()} style={styles.back}>
            <ChevronLeft color="#fff" size={26} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={[styles.title, { fontFamily: fonts.bold }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingTop: 48,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  back: { padding: 4, marginRight: 4 },
  backPlaceholder: { width: 34 },
  title: { flex: 1, color: '#fff', fontSize: 18 },
  right: { minWidth: 36, alignItems: 'flex-end' },
});
