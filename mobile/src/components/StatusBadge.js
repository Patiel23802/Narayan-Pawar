import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';

const mapKey = {
  registered: 'status_registered',
  assigned: 'status_assigned',
  in_progress: 'status_in_progress',
  resolved: 'status_resolved',
  rejected: 'status_rejected',
  not_started: 'status_not_started',
  completed: 'status_completed',
};

const tone = {
  registered: '#6366f1',
  assigned: '#0ea5e9',
  in_progress: '#f59e0b',
  resolved: '#16a34a',
  rejected: '#ef4444',
  not_started: '#94a3b8',
  completed: '#16a34a',
};

export function StatusBadge({ status }) {
  const { t, fonts } = useLocale();
  const key = mapKey[status] || 'status_registered';
  const bg = tone[status] || tone.registered;
  return (
    <View style={[styles.wrap, { backgroundColor: `${bg}22`, borderColor: `${bg}55` }]}>
      <Text style={[styles.text, { fontFamily: fonts.medium, color: bg }]}>
        {t(key)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  text: { fontSize: 12 },
});
