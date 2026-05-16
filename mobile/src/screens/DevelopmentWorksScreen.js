import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, Menu, MapPin } from 'lucide-react-native';
import { ProgressBar } from '../components/ProgressBar';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const CHIPS = [
  { key: 'all', status: 'all', labelKey: 'worksFilterAll' },
  { key: 'in_progress', status: 'in_progress', labelKey: 'worksFilterInProgress' },
  { key: 'completed', status: 'completed', labelKey: 'worksFilterCompleted' },
  { key: 'planned', status: 'planned', labelKey: 'worksFilterPlanned' },
];

const { width } = Dimensions.get('window');
const PROJECT_FALLBACKS = [
  require('../../assets/projects/project-1.jpg'),
  require('../../assets/projects/project-2.jpg'),
  require('../../assets/projects/project-3.jpg'),
  require('../../assets/projects/project-4.jpg'),
];

function hashIdx(id) {
  const s = String(id ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  const n = Math.abs(h);
  return PROJECT_FALLBACKS.length ? n % PROJECT_FALLBACKS.length : 0;
}

export function DevelopmentWorksScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const [chip, setChip] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allStats, setAllStats] = useState({ inProgress: 0, completed: 0, total: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const st = CHIPS.find((c) => c.key === chip)?.status;
      const params = st && st !== 'all' ? { status: st } : {};
      const [res, all] = await Promise.all([api.get('/api/projects', { params }), api.get('/api/projects')]);
      const list = res.data.projects || [];
      setItems(list);

      const allList = all.data.projects || [];
      const inProgress = allList.filter((p) => (p.status || '').toLowerCase() === 'in_progress').length;
      const completed = allList.filter((p) => (p.status || '').toLowerCase() === 'completed').length;
      setAllStats({ inProgress, completed, total: allList.length });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [chip])
  );

  const timelyPct = useMemo(() => {
    if (!allStats.total) return 82;
    const denom = Math.max(1, allStats.inProgress + allStats.completed);
    const pct = Math.round((allStats.completed / denom) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [allStats]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#E67600', '#F08A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Pressable
              onPress={() => router.push('/(tabs)/home')}
              style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]}
              hitSlop={10}
            >
              <Menu size={22} color="#fff" />
            </Pressable>
            <Text style={[styles.brand, { fontFamily: fonts.bold }]} numberOfLines={1}>
              The Civic Pulse
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/updates')}
            style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]}
            hitSlop={10}
          >
            <Bell size={22} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.colWrap}
        contentContainerStyle={styles.listBody}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={[styles.h1, { fontFamily: fonts.bold }]}>{t('developmentWorks')}</Text>
              <Text style={[styles.hint, { fontFamily: fonts.medium }]}>
                {t('worksHeroHint')}
              </Text>
            </View>

            <ScrollChips chip={chip} setChip={setChip} fonts={fonts} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
          ) : (
            <Text style={{ textAlign: 'center', color: colors.textMuted, fontFamily: fonts.medium, marginTop: 18 }}>
              {t('noProjects')}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/work/${item.id}`)}
            style={({ pressed }) => [styles.cardPress, pressed ? styles.pressed : null]}
          >
            <View style={styles.card}>
              <Image
                source={item.image_url ? { uri: mediaUrl(item.image_url) } : PROJECT_FALLBACKS[hashIdx(item.id)]}
                style={styles.img}
              />

              <View style={[styles.statusPill, statusTone(item.status).pill]}>
                <Text style={[styles.statusText, { fontFamily: fonts.bold }, statusTone(item.status).text]}>
                  {t(`status_${statusLabel(item.status)}`)}
                </Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.locRow}>
                  <MapPin size={14} color="#5a5c5c" />
                  <Text style={[styles.loc, { fontFamily: fonts.medium }]} numberOfLines={1}>
                    {item.location_text || '—'}
                  </Text>
                </View>

                <Text style={[styles.title, { fontFamily: fonts.bold }]} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={{ marginTop: 4 }}>
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressK, { fontFamily: fonts.bold }]}>{t('progress')}</Text>
                    <Text style={[styles.progressK, { fontFamily: fonts.bold }]}>{Math.round(item.progress_percent || 0)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, Number(item.progress_percent) || 0))}%`, backgroundColor: statusTone(item.status).bar }]} />
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={[styles.meta, { fontFamily: fonts.medium }]} numberOfLines={1}>
                    {t('expectedCompletion')}: <Text style={{ fontFamily: fonts.bold }}>{item.expected_completion_date || '—'}</Text>
                  </Text>
                  <View style={styles.detailsBtn}>
                    <Text style={[styles.detailsText, { fontFamily: fonts.bold }]}>{t('viewDetails')}</Text>
                    <ChevronRight size={16} color="#FF8C00" />
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.insights}>
            <View style={styles.insightsLeft}>
              <Text style={[styles.insTitle, { fontFamily: fonts.bold }]}>{t('projectInsights')}</Text>
              <Text style={[styles.insHint, { fontFamily: fonts.medium }]}>
                {t('projectInsightsHint')}
              </Text>

              <View style={styles.insGrid}>
                <View style={styles.insBox}>
                  <Text style={[styles.insNum, { fontFamily: fonts.bold }]}>{allStats.inProgress || 0}</Text>
                  <Text style={[styles.insLbl, { fontFamily: fonts.bold }]}>{t('insightsInProgress')}</Text>
                </View>
                <View style={styles.insBox}>
                  <Text style={[styles.insNumDone, { fontFamily: fonts.bold }]}>{allStats.completed || 0}</Text>
                  <Text style={[styles.insLbl, { fontFamily: fonts.bold }]}>{t('insightsCompleted')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.donutWrap}>
              <View style={styles.donutOuter}>
                <View style={styles.donutTrack} />
                <View style={[styles.donutArc, { transform: [{ rotate: `${(timelyPct / 100) * 360}deg` }] }]} />
                <View style={styles.donutCenter}>
                  <Text style={[styles.donutPct, { fontFamily: fonts.bold }]}>{timelyPct}%</Text>
                  <Text style={[styles.donutLbl, { fontFamily: fonts.bold }]}>{t('onTime')}</Text>
                </View>
              </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

function ScrollChips({ chip, setChip, fonts }) {
  const { t } = useLocale();
  return (
    <View style={styles.chipsRow}>
      {CHIPS.map((c) => {
        const active = chip === c.key;
        return (
          <Pressable key={c.key} onPress={() => setChip(c.key)} style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
            <Text style={[styles.chipText, { fontFamily: fonts.bold }, active ? styles.chipTextActive : styles.chipTextInactive]}>
              {t(c.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function statusLabel(st) {
  const s = String(st || '').toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'planned') return 'planned';
  return 'in_progress';
}

function statusTone(st) {
  const s = String(st || '').toLowerCase();
  if (s === 'completed') {
    return { pill: { backgroundColor: '#dcfce7' }, text: { color: '#15803d' }, bar: '#16a34a' };
  }
  if (s === 'planned') {
    return { pill: { backgroundColor: '#e1e3e3' }, text: { color: '#5a5c5c' }, bar: '#acadad' };
  }
  return { pill: { backgroundColor: '#ffedd5' }, text: { color: '#ea580c' }, bar: '#FF8C00' };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f6f6' },
  topBar: { paddingTop: 52, paddingBottom: 12, paddingHorizontal: 14, shadowColor: '#FF8C00', shadowOpacity: 0.22, shadowRadius: 16, elevation: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBtn: { padding: 8, borderRadius: 999 },
  iconBtnPressed: { backgroundColor: 'rgba(255,255,255,0.10)' },
  brand: { color: '#fff', fontSize: 18, flexShrink: 1 },

  listBody: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 },
  hero: { marginBottom: 14 },
  h1: { fontSize: 30, color: '#2d2f2f', marginBottom: 6 },
  hint: { color: '#5a5c5c', lineHeight: 20 },

  chipsRow: { flexDirection: 'row', gap: 10, paddingVertical: 12 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  chipActive: { backgroundColor: '#FF8C00', shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  chipInactive: { backgroundColor: '#e1e3e3' },
  chipText: { fontSize: 13 },
  chipTextActive: { color: '#fff' },
  chipTextInactive: { color: '#5a5c5c' },

  colWrap: { justifyContent: 'space-between' },
  cardPress: { width: (width - 16 * 2 - 12) / 2, marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  img: { width: '100%', height: 120 },
  imgPh: { backgroundColor: '#e7e8e8' },
  statusPill: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  cardBody: { padding: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loc: { fontSize: 12, color: '#5a5c5c', flex: 1 },
  title: { fontSize: 15, color: '#2d2f2f', marginTop: 6, minHeight: 38 },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressK: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#5a5c5c' },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: '#dbdddd', overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 999 },

  cardBottom: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e7e8e8' },
  meta: { fontSize: 11, color: '#5a5c5c' },
  detailsBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'flex-end' },
  detailsText: { color: '#FF8C00', fontSize: 12 },

  insights: { marginTop: 18, backgroundColor: '#f0f1f1', borderRadius: 28, padding: 16, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  insightsLeft: { flex: 1 },
  insTitle: { fontSize: 18, color: '#2d2f2f', marginBottom: 8 },
  insHint: { fontSize: 12, color: '#5a5c5c', lineHeight: 18 },
  insGrid: { marginTop: 12, flexDirection: 'row', gap: 10 },
  insBox: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  insNum: { fontSize: 28, color: '#FF8C00' },
  insNumDone: { fontSize: 28, color: '#16a34a' },
  insLbl: { marginTop: 4, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: '#5a5c5c' },

  donutWrap: { width: 140, alignItems: 'center', justifyContent: 'center' },
  donutOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 2, alignItems: 'center', justifyContent: 'center' },
  donutTrack: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 16, borderColor: '#e7e8e8' },
  donutArc: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 16, borderColor: '#FF8C00', borderLeftColor: 'transparent', borderBottomColor: 'transparent' },
  donutCenter: { alignItems: 'center' },
  donutPct: { fontSize: 28, color: '#2d2f2f' },
  donutLbl: { marginTop: 2, fontSize: 10, color: '#5a5c5c', letterSpacing: 1.6, textTransform: 'uppercase' },

  pressed: { transform: [{ scale: 0.99 }] },
});
