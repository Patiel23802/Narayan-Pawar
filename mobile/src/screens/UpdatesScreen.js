import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppCard } from '../components/AppCard';
import { colors, spacing } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export function UpdatesScreen() {
  const navigation = useNavigation();
  const { t, fonts } = useLocale();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/updates');
      setItems(res.data.updates || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title={t('updates')} navigation={navigation} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.textMuted, fontFamily: fonts.regular }}>
              {t('noUpdates')}
            </Text>
          }
          renderItem={({ item }) => (
            <AppCard style={{ marginBottom: spacing.md }}>
              <Text style={[styles.title, { fontFamily: fonts.bold }]}>{item.title}</Text>
              <Text style={[styles.type, { fontFamily: fonts.regular }]}>{item.type}</Text>
              <Text style={[styles.desc, { fontFamily: fonts.regular }]}>{item.description}</Text>
              <Text style={[styles.date, { fontFamily: fonts.regular }]}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </AppCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 17, color: colors.text },
  type: { fontSize: 12, color: colors.primary, marginTop: 4 },
  desc: { marginTop: spacing.sm, color: colors.text, lineHeight: 22 },
  date: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
});
