import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CalendarDays, Check, MapPin, Share2, RefreshCw } from 'lucide-react-native';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { AppCard } from '../components/AppCard';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';

export function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t, fonts } = useLocale();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/projects/${id}`);
        setP(res.data.project);
      } catch (e) {
        Alert.alert(t('error'), e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  if (loading || !p) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={['#FF8C00', '#FFA500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
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
                {t('projectDetails')}
              </Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  const tl = (p.timeline || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const pct = Math.max(0, Math.min(100, Number(p.progress_percent) || 0));
  const statusKey = p.status === 'completed' ? 'completed' : p.status;
  const steps = buildProjectSteps(tl, statusKey, t);

  const onShare = async () => {
    try {
      await Share.share({
        message: `${p.title || ''}\n${p.location_text || ''}\n\n${p.description || ''}`,
      });
    } catch {
      // ignore
    }
  };

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
              {t('projectDetails')}
            </Text>
          </View>
          <Pressable onPress={onShare} style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]} hitSlop={10}>
            <Share2 size={22} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.kicker, { fontFamily: fonts.bold }]}>{t('projectStatus')}</Text>
              <View style={styles.statusPill}>
                <Text style={[styles.statusPillText, { fontFamily: fonts.bold }]}>{t('activeProject')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroWrap}>
            {p.image_url ? (
              <Image source={{ uri: mediaUrl(p.image_url) }} style={styles.heroImg} />
            ) : (
              <View style={[styles.heroImg, { backgroundColor: '#e7e8e8' }]} />
            )}
            <LinearGradient colors={['rgba(0,0,0,0.60)', 'rgba(0,0,0,0.0)']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.heroShade} />
            <View style={styles.heroText}>
              <Text style={[styles.heroTitle, { fontFamily: fonts.bold }]} numberOfLines={2}>
                {p.title}
              </Text>
              <View style={styles.heroLocRow}>
                <MapPin size={14} color="rgba(255,255,255,0.9)" />
                <Text style={[styles.heroLoc, { fontFamily: fonts.medium }]} numberOfLines={1}>
                  {p.location_text || '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionKicker, { fontFamily: fonts.bold }]}>{t('progress')}</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHead}>
              <Text style={[styles.pct, { fontFamily: fonts.bold }]}>{Math.round(pct)}%</Text>
              <Text style={[styles.pctHint, { fontFamily: fonts.bold }]}>{t('workCompleted')}</Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={['#FF8C00', '#FF4500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${pct}%` }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionKicker, { fontFamily: fonts.bold }]}>{t('financialInfo')}</Text>
          <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.budgetCard}>
            <View>
              <Text style={[styles.budgetKicker, { fontFamily: fonts.bold }]}>{t('totalBudget')}</Text>
              <Text style={[styles.budgetValue, { fontFamily: fonts.bold }]}>{p.budget || '₹ —'}</Text>
            </View>
            <View style={styles.budgetIcon}>
              <Text style={[styles.budgetGlyph, { fontFamily: fonts.bold }]}>₹</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionKicker, { fontFamily: fonts.bold }]}>{t('importantInfo')}</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon={<CalendarDays size={18} color="#FF8C00" />}
              label={t('startDate')}
              value={p.start_date || '—'}
              fonts={fonts}
            />
            <Divider />
            <InfoRow
              icon={<CalendarDays size={18} color="#FF8C00" />}
              label={t('expectedCompletion')}
              value={p.expected_completion_date || '—'}
              fonts={fonts}
            />
            <Divider />
            <InfoRow
              icon={<Check size={18} color="#FF8C00" />}
              label={t('contractor')}
              value={p.contractor || '—'}
              fonts={fonts}
            />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionKicker, { fontFamily: fonts.bold }]}>{t('statusReport')}</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineLine} />
            {steps.map((s, idx) => (
              <View key={`${s.key}-${idx}`} style={[styles.stepRow, idx === steps.length - 1 ? styles.stepLast : null]}>
                <View style={[styles.stepDot, s.active ? styles.stepDotActive : styles.stepDotInactive, s.spinning ? styles.stepDotRing : null]}>
                  {s.spinning ? <RefreshCw size={16} color="#fff" /> : <Check size={16} color={s.active ? '#fff' : 'rgba(90,92,92,0.45)'} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { fontFamily: fonts.bold }, s.spinning ? styles.stepTitleActive : !s.active ? styles.stepTitleInactive : null]}>
                    {s.title}
                  </Text>
                  <Text style={[styles.stepMeta, { fontFamily: fonts.medium }, !s.active ? styles.stepMetaInactive : null]}>{s.meta}</Text>
                  {s.note ? (
                    <View style={styles.notePill}>
                      <Text style={[styles.noteText, { fontFamily: fonts.bold }]}>{s.note}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mapBtn}>
          <Pressable onPress={() => Linking.openURL('https://maps.google.com')} style={({ pressed }) => [styles.mapPress, pressed ? styles.pressed : null]}>
            <Text style={[styles.mapText, { fontFamily: fonts.bold }]}>{t('viewMap')}</Text>
          </Pressable>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function InfoRow({ icon, label, value, fonts }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIcon}>{icon}</View>
        <Text style={[styles.infoLabel, { fontFamily: fonts.bold }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { fontFamily: fonts.bold }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function buildProjectSteps(tl, status, t) {
  const fmt = (d) => {
    try {
      const dt = new Date(d);
      if (!d || Number.isNaN(dt.getTime())) return '';
      return dt.toLocaleDateString();
    } catch {
      return '';
    }
  };
  const first = (tl || [])[0];
  const second = (tl || [])[1];
  const third = (tl || [])[2];
  const fourth = (tl || [])[3];

  const done = status === 'completed';
  const active = status === 'in_progress' || status === 'planned' || status === 'assigned' || !done;

  return [
    { key: 'tender', title: first?.title || t('stepTenderApproved'), meta: fmt(first?.created_at) || '—', active: true },
    { key: 'start', title: second?.title || t('stepWorkStarted'), meta: fmt(second?.created_at) || '—', active: true },
    { key: 'base', title: third?.title || t('stepFoundationComplete'), meta: fmt(third?.created_at) || '—', active: true },
    {
      key: 'asphalt',
      title: fourth?.title || t('stepAsphaltInProgress'),
      meta: fmt(fourth?.created_at) || (done ? t('done') : t('now')),
      note: done ? null : fourth?.description || t('workOngoingFast'),
      active,
      spinning: !done,
    },
  ];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f6f6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingTop: 52, paddingBottom: 12, paddingHorizontal: 14, shadowColor: '#FF8C00', shadowOpacity: 0.22, shadowRadius: 16, elevation: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBtn: { padding: 8, borderRadius: 999 },
  iconBtnPressed: { backgroundColor: 'rgba(255,255,255,0.10)' },
  topTitle: { color: '#fff', fontSize: 18, flexShrink: 1 },

  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120, gap: 18 },

  heroSection: { gap: 12 },
  heroTopRow: { paddingHorizontal: 4 },
  kicker: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#5a5c5c' },
  statusPill: { marginTop: 6, backgroundColor: '#dbeafe', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: '#2563eb' },

  heroWrap: { borderRadius: 20, overflow: 'hidden', aspectRatio: 16 / 10, backgroundColor: '#e7e8e8', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  heroImg: { width: '100%', height: '100%' },
  heroShade: { position: 'absolute', inset: 0 },
  heroText: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  heroTitle: { color: '#fff', fontSize: 18, lineHeight: 22 },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  heroLoc: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

  sectionBlock: { gap: 10 },
  sectionKicker: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#5a5c5c', paddingHorizontal: 4 },

  progressCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  progressHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  pct: { fontSize: 36, color: '#2d2f2f' },
  pctHint: { fontSize: 12, color: '#5a5c5c' },
  progressTrack: { height: 12, borderRadius: 999, backgroundColor: '#f0f1f1', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },

  budgetCard: { borderRadius: 20, padding: 16, shadowColor: '#FF8C00', shadowOpacity: 0.2, shadowRadius: 14, elevation: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  budgetKicker: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' },
  budgetValue: { marginTop: 6, fontSize: 28, color: '#fff' },
  budgetIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14 },
  budgetGlyph: { color: '#fff', fontSize: 26, lineHeight: 28 },

  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  infoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: '#5a5c5c', fontSize: 13 },
  infoValue: { color: '#2d2f2f', fontSize: 13, marginLeft: 12, maxWidth: '45%' },
  divider: { height: 1, backgroundColor: '#f0f1f1', marginVertical: 12 },

  timelineCard: { backgroundColor: '#f0f1f1', borderRadius: 20, padding: 16, position: 'relative' },
  timelineLine: { position: 'absolute', left: 32, top: 26, bottom: 26, width: 2, backgroundColor: 'rgba(172,173,173,0.30)' },
  stepRow: { flexDirection: 'row', gap: 12, paddingBottom: 18 },
  stepLast: { paddingBottom: 0 },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#FF8C00', shadowColor: '#FF8C00', shadowOpacity: 0.18, shadowRadius: 10, elevation: 3 },
  stepDotInactive: { backgroundColor: '#e1e3e3' },
  stepDotRing: { borderWidth: 4, borderColor: 'rgba(255,140,0,0.10)' },
  stepTitle: { fontSize: 13, color: '#2d2f2f' },
  stepTitleActive: { color: '#FF8C00' },
  stepTitleInactive: { color: 'rgba(90,92,92,0.55)' },
  stepMeta: { marginTop: 2, fontSize: 11, color: '#5a5c5c' },
  stepMetaInactive: { color: 'rgba(90,92,92,0.35)' },
  notePill: { marginTop: 10, backgroundColor: '#ffedd5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#fed7aa', alignSelf: 'flex-start' },
  noteText: { fontSize: 11, color: '#c2410c' },

  mapBtn: { height: 56, borderRadius: 18, overflow: 'hidden', shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 14, elevation: 6, marginTop: 6 },
  mapPress: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapText: { color: '#fff', fontSize: 16 },

  pressed: { transform: [{ scale: 0.985 }] },
});
