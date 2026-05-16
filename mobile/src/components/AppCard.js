import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../constants/theme';

export function AppCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
