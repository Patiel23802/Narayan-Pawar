import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  maxLength,
  multiline,
  style,
  right,
  editable = true,
}) {
  const { fonts } = useLocale();
  return (
    <View style={styles.block}>
      {label ? (
        <Text style={[styles.label, { fontFamily: fonts.medium }]}>{label}</Text>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          editable={editable}
          style={[
            styles.input,
            { fontFamily: fonts.regular },
            multiline && { minHeight: 100, textAlignVertical: 'top' },
            style,
          ]}
        />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
});
