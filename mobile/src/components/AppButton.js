import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../constants/theme';

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  textStyle,
}) {
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.9 }, style]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, disabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.outline,
        pressed && { opacity: 0.85 },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={[styles.outlineText, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radii.lg, overflow: 'hidden' },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  outlineText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.55 },
});
