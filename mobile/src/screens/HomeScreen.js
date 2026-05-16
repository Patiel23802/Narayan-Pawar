import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ClipboardPlus,
  Construction,
  HardHat,
  Menu,
  Megaphone,
  Phone,
  ChevronRight,
  CalendarDays,
} from 'lucide-react-native';
import { AppCard } from '../components/AppCard';
import { WhatsAppFab } from '../components/WhatsAppFab';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';
import { ProgressBar } from '../components/ProgressBar';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const REP_FALLBACK = require('../../assets/representative.png');
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

export function HomeScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const [rep, setRep] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([
          api.get('/api/representative'),
          api.get('/api/projects'),
        ]);
        setRep(r.data.representative);
        setProjects((p.data.projects || []).slice(0, 5));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const actions = [
    {
      key: 'c',
      label: t('quickRegister'),
      sub: t('quickRegisterSub'),
      icon: ClipboardPlus,
      iconBg: '#FF8C00',
      iconColor: '#fff',
      onPress: () => router.push('/(tabs)/complaints/register'),
    },
    {
      key: 'w',
      label: t('quickWork'),
      sub: t('quickWorkSub'),
      icon: Construction,
      iconBg: '#FFC87F',
      iconColor: '#644000',
      onPress: () => router.push('/(tabs)/work'),
    },
    {
      key: 'u',
      label: t('quickUpdates'),
      sub: t('quickUpdatesSub'),
      icon: Megaphone,
      iconBg: '#9DF197',
      iconColor: '#005C15',
      onPress: () => router.push('/(tabs)/updates'),
    },
    {
      key: 'p',
      label: t('quickContact'),
      sub: t('quickContactSub'),
      icon: Phone,
      iconBg: '#DBDDDD',
      iconColor: '#5A5C5C',
      onPress: () => router.push('/(tabs)/home/emergency'),
    },
  ];

  const repName = rep?.name || t('repNameDefault');
  const repSubtitle =
    rep?.bio ||
    t('repSubtitleDefault');

  const fmtDate = (d) => {
    try {
      if (!d) return t('dateUnknown');
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return t('dateUnknown');
      return dt.toLocaleDateString();
    } catch {
      return t('dateUnknown');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#E67600', '#F08A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Pressable
              onPress={() => router.push('/(tabs)/home/representative')}
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

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroGrid}>
            <View style={styles.heroLeft}>
              <View style={styles.heroBadge}>
                <Text style={[styles.heroBadgeText, { fontFamily: fonts.bold }]}>{t('wardRepresentativeBadge')}</Text>
              </View>
              <Text style={[styles.heroTitle, { fontFamily: fonts.bold }]} numberOfLines={2}>
                {repName}
              </Text>
              <Text style={[styles.heroDesc, { fontFamily: fonts.medium }]} numberOfLines={4}>
                {repSubtitle}
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.statKicker, { fontFamily: fonts.bold }]}>{t('experienceLabel')}</Text>
                  <Text style={[styles.statValue, { fontFamily: fonts.bold }]}>{t('experienceValue')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={[styles.statKicker, { fontFamily: fonts.bold }]}>{t('completedProjectsLabel')}</Text>
                  <Text style={[styles.statValue, { fontFamily: fonts.bold }]}>{t('completedProjectsValue')}</Text>
                </View>
              </View>
            </View>

            <Pressable style={styles.heroRight} onPress={() => router.push('/(tabs)/home/representative')}>
              <Image
                source={rep?.photo_url ? { uri: mediaUrl(rep.photo_url) } : REP_FALLBACK}
                style={styles.heroImg}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.0)']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={styles.heroImgOverlay}
              />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.kicker, { fontFamily: fonts.bold }]}>{t('quickActions')}</Text>
        <View style={styles.grid}>
          {actions.map((a) => (
            <Pressable
              key={a.key}
              onPress={a.onPress}
              style={({ pressed }) => [styles.actionTile, pressed ? styles.tilePressed : null]}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.iconBg }]}>
                <a.icon color={a.iconColor} size={22} />
              </View>
              <Text style={[styles.actionLabel, { fontFamily: fonts.bold }]} numberOfLines={1}>
                {a.label}
              </Text>
              <Text style={[styles.actionSub, { fontFamily: fonts.medium }]} numberOfLines={1}>
                {a.sub}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeadRow}>
          <View>
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold }]}>{t('nearbyUpdates')}</Text>
            <Text style={[styles.sectionSub, { fontFamily: fonts.medium }]}>{t('latestActivity')}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/updates')} style={styles.seeAll}>
            <Text style={[styles.seeAllText, { fontFamily: fonts.bold }]}>{t('seeAll')}</Text>
            <ChevronRight size={18} color="#FF8C00" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
          snapToInterval={width * 0.74 + spacing.lg}
          decelerationRate="fast"
        >
          {(projects || []).slice(0, 3).map((item, idx) => {
            const status = idx === 0 ? t('status_in_progress') : idx === 1 ? t('status_completed') : t('status_upcoming');
            const statusBg = idx === 1 ? '#176a21' : idx === 2 ? '#ff8c00' : '#FF8C00';
            const progress = idx === 1 ? 100 : idx === 2 ? 10 : Math.min(95, Math.max(5, item.progress_percent || 65));
            return (
              <Pressable
                key={item.id}
                style={styles.updateCardWrap}
                onPress={() => router.push(`/(tabs)/work/${item.id}`)}
              >
                <View style={styles.updateCard}>
                  <View style={styles.updateImgWrap}>
                    <Image
                      source={item.image_url ? { uri: mediaUrl(item.image_url) } : PROJECT_FALLBACKS[hashIdx(item.id)]}
                      style={styles.updateImg}
                    />
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusText, { fontFamily: fonts.bold }]}>{status}</Text>
                    </View>
                  </View>
                  <View style={styles.updateBody}>
                    <Text style={[styles.updateTitle, { fontFamily: fonts.bold }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.dateRow}>
                      <CalendarDays size={15} color="#5a5c5c" />
                      <Text style={[styles.dateText, { fontFamily: fonts.medium }]}>{fmtDate(item.updated_at || item.created_at)}</Text>
                    </View>
                    <ProgressBar value={progress} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <WhatsAppFab phoneE164={rep?.social_whatsapp || '919876543210'} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 14,
    shadowColor: '#FF8C00',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBtn: { padding: 8, borderRadius: 999 },
  iconBtnPressed: { backgroundColor: 'rgba(255,255,255,0.10)' },
  brand: { color: '#fff', fontSize: 20, flexShrink: 1 },

  body: { paddingBottom: 120 },

  heroCard: { paddingHorizontal: 16, paddingTop: 16 },
  heroGrid: {
    backgroundColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  heroLeft: { padding: 18 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 10 },
  heroBadgeText: { color: '#FF8C00', fontSize: 10, letterSpacing: 0.6 },
  heroTitle: { fontSize: 28, color: '#2d2f2f', lineHeight: 32, marginBottom: 8 },
  heroDesc: { fontSize: 16, color: '#5a5c5c', lineHeight: 22, marginBottom: 14 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center' },
  statCol: { flex: 1 },
  statKicker: { fontSize: 10, color: '#5a5c5c', letterSpacing: 1.2, textTransform: 'uppercase' },
  statValue: { fontSize: 18, color: '#FF8C00', marginTop: 4 },
  statDivider: { width: 1, height: 34, backgroundColor: '#e7e8e8', marginHorizontal: 12 },
  heroRight: { width: '100%', height: 300 },
  heroImg: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  heroImgOverlay: { position: 'absolute', inset: 0 },

  kicker: { marginTop: 18, marginBottom: 12, paddingHorizontal: 16, fontSize: 12, color: '#5a5c5c', letterSpacing: 2, textTransform: 'uppercase' },
  grid: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionTile: {
    width: (width - 16 * 2 - 12) / 2,
    backgroundColor: '#f0f1f1',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,183,77,0.0)',
  },
  tilePressed: { transform: [{ scale: 0.98 }] },
  actionIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  actionLabel: { fontSize: 14, color: '#2d2f2f' },
  actionSub: { marginTop: 2, fontSize: 11, color: '#5a5c5c' },

  sectionHeadRow: { marginTop: 22, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 24, color: '#2d2f2f' },
  sectionSub: { marginTop: 2, fontSize: 12, color: '#5a5c5c' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingLeft: 8 },
  seeAllText: { color: '#FF8C00', fontSize: 13 },

  hScroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 16 },
  updateCardWrap: { width: width * 0.74 },
  updateCard: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, elevation: 2 },
  updateImgWrap: { height: 176, position: 'relative' },
  updateImg: { width: '100%', height: '100%' },
  statusPill: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  updateBody: { padding: 16 },
  updateTitle: { fontSize: 16, color: '#2d2f2f', marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dateText: { color: '#5a5c5c', fontSize: 12 },

  projPh: { backgroundColor: colors.border },
});
