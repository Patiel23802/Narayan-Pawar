import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';

export function ProgressBar({ value = 0, showLabel }) {
  const { fonts } = useLocale();
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <View style={styles.wrap}>
      {showLabel ? (
        <Text style={[styles.label, { fontFamily: fonts.medium }]}>{pct}%</Text>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  track: {
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },
});
