import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react-native';
import { AppCard } from '../components/AppCard';
import { StatusBadge } from '../components/StatusBadge';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';

const TABS = [
  { key: 'all', q: 'all' },
  { key: 'pending', q: 'pending' },
  { key: 'resolved', q: 'resolved' },
];

export function MyComplaintsScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const q = TABS.find((x) => x.key === tab)?.q || 'all';
      const res = await api.get('/api/complaints/my', { params: { status: q } });
      setItems(res.data.complaints || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [tab])
  );

  const avatarUri = mediaUrl(user?.avatar_url);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#E67600', '#F08A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : null)}
              style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]}
              hitSlop={10}
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <Text style={[styles.topTitle, { fontFamily: fonts.bold }]} numberOfLines={1}>
              {t('passwordTitle')}
            </Text>
          </View>
          <View style={styles.avatarChip}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPh}>
                <Text style={[styles.avatarPhText, { fontFamily: fonts.bold }]}>
                  {(user?.full_name || 'U').slice(0, 1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={[styles.h1, { fontFamily: fonts.bold }]}>{t('myComplaints')}</Text>
              <Text style={[styles.hint, { fontFamily: fonts.medium }]}>
                {t('myComplaintsHint')}
              </Text>
            </View>

            <View style={styles.tabsRow}>
              {TABS.map((x) => {
                const active = tab === x.key;
                const label = x.key === 'all' ? t('tabAll') : x.key === 'pending' ? t('tabPending') : t('tabResolved');
                return (
                  <Pressable
                    key={x.key}
                    onPress={() => setTab(x.key)}
                    style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
                  >
                    <Text style={[styles.tabText, { fontFamily: fonts.bold }, active ? styles.tabTextActive : styles.tabTextInactive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
          ) : (
            <Text style={{ textAlign: 'center', color: colors.textMuted, fontFamily: fonts.medium, marginTop: 18 }}>
              {t('noComplaints')}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(tabs)/complaints/${item.id}`)} style={({ pressed }) => [styles.cardPress, pressed ? styles.pressed : null]}>
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <StatusBadge status={item.status} />
                <Text style={[styles.complaintNo, { fontFamily: fonts.medium }]}>{item.complaint_no || ''}</Text>
              </View>
              <Text style={[styles.title, { fontFamily: fonts.bold }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.desc, { fontFamily: fonts.medium }]} numberOfLines={2}>
                {item.description || ''}
              </Text>
              <View style={styles.cardBottom}>
                <View style={styles.dateRow}>
                  <CalendarDays size={14} color="#5a5c5c" />
                  <Text style={[styles.dateText, { fontFamily: fonts.bold }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailsBtn}>
                  <Text style={[styles.detailsText, { fontFamily: fonts.bold }]}>{t('viewDetails')}</Text>
                  <ChevronRight size={18} color="#FF8C00" />
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />

      {loading ? (
        null
      ) : null}

      <Pressable style={styles.fab} onPress={() => router.push('/(tabs)/complaints/register')}>
        <Plus color="#fff" size={28} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f6f6' },

  topBar: { paddingTop: 52, paddingBottom: 12, paddingHorizontal: 14, shadowColor: '#FF8C00', shadowOpacity: 0.22, shadowRadius: 16, elevation: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBtn: { padding: 8, borderRadius: 999 },
  iconBtnPressed: { backgroundColor: 'rgba(255,255,255,0.10)' },
  topTitle: { color: '#fff', fontSize: 18, flexShrink: 1 },
  avatarChip: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.20)' },
  avatar: { width: '100%', height: '100%' },
  avatarPh: { width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarPhText: { color: '#fff', fontSize: 14 },

  hero: { marginBottom: 14 },
  h1: { fontSize: 30, color: '#2d2f2f', marginBottom: 6 },
  hint: { color: '#5a5c5c', lineHeight: 20 },

  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  tabActive: { backgroundColor: '#FF8C00', shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  tabInactive: { backgroundColor: '#e1e3e3' },
  tabText: { fontSize: 13 },
  tabTextActive: { color: '#fff' },
  tabTextInactive: { color: '#5a5c5c' },

  cardPress: { marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  complaintNo: { color: '#5a5c5c', fontSize: 12 },
  title: { fontSize: 18, color: '#2d2f2f', marginBottom: 8 },
  desc: { color: '#5a5c5c', fontSize: 13, lineHeight: 18 },
  cardBottom: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e7e8e8', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { color: '#5a5c5c', fontSize: 12 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsText: { color: '#FF8C00', fontSize: 13 },

  pressed: { transform: [{ scale: 0.99 }] },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#FF8C00',
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
});
