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
  Modal,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CalendarDays, Check, Expand, MapPin, Share2, RefreshCw, User } from 'lucide-react-native';
import { StatusBadge } from '../components/StatusBadge';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';

export function ComplaintDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t, fonts } = useLocale();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgOpen, setImgOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/complaints/${id}`);
        setC(res.data.complaint);
      } catch (e) {
        Alert.alert(t('error'), e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  if (loading || !c) {
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
                {t('complaintDetails')}
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

  const timeline = (c.timeline || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const createdAt = c.created_at ? new Date(c.created_at) : null;
  const createdLabel = createdAt ? createdAt.toLocaleDateString() : '';

  const onShare = async () => {
    try {
      await Share.share({
        message: `${c.complaint_no || ''}\n${c.title || ''}\n\n${c.description || ''}`,
      });
    } catch {
      // ignore
    }
  };

  const timelineSteps = buildTimelineSteps(c, timeline, t);

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
              {t('complaintDetails')}
            </Text>
          </View>
          <Pressable onPress={onShare} style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]} hitSlop={10}>
            <Share2 size={22} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View>
            <Text style={[styles.idKicker, { fontFamily: fonts.bold }]}>{t('complaintId')}</Text>
            <Text style={[styles.idValue, { fontFamily: fonts.bold }]}>{c.complaint_no || ''}</Text>
          </View>
          <StatusBadge status={c.status} />
        </View>

        <View style={styles.detailsCard}>
          <Text style={[styles.title, { fontFamily: fonts.bold }]}>{c.title}</Text>
          <Text style={[styles.desc, { fontFamily: fonts.medium }]}>{c.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={18} color="#FF8C00" />
              <Text style={[styles.metaText, { fontFamily: fonts.bold }]} numberOfLines={2}>
                {c.location_text || '—'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <CalendarDays size={18} color="#FF8C00" />
              <Text style={[styles.metaText, { fontFamily: fonts.bold }]}>{createdLabel}</Text>
            </View>
          </View>
        </View>

        {c.image_url ? (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionKicker, { fontFamily: fonts.bold }]}>{t('attachedPhoto')}</Text>
            <Pressable onPress={() => setImgOpen(true)} style={({ pressed }) => [styles.attachment, pressed ? styles.pressed : null]}>
              <Image source={{ uri: mediaUrl(c.image_url) }} style={styles.attachmentImg} />
              <View style={styles.attachmentShade} />
              <View style={styles.fullBtn}>
                <Expand size={16} color="#fff" />
              </View>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionKicker, { fontFamily: fonts.bold }]}>{t('complaintProgress')}</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineLine} />
            {timelineSteps.map((s, idx) => (
              <View key={`${s.key}-${idx}`} style={[styles.stepRow, idx === timelineSteps.length - 1 ? styles.stepLast : null]}>
                <View style={[styles.stepDot, s.state === 'inactive' ? styles.stepDotInactive : styles.stepDotActive, s.state === 'active' ? styles.stepDotRing : null]}>
                  {s.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.stepTitle,
                      { fontFamily: fonts.bold },
                      s.state === 'active' ? styles.stepTitleActive : s.state === 'inactive' ? styles.stepTitleInactive : null,
                    ]}
                  >
                    {s.title}
                  </Text>
                  <Text style={[styles.stepMeta, { fontFamily: fonts.medium }, s.state === 'inactive' ? styles.stepMetaInactive : null]}>
                    {s.meta}
                  </Text>
                  {s.note ? (
                    <View style={styles.notePill}>
                      <Text style={[styles.noteText, { fontFamily: fonts.bold }]}>{s.note}</Text>
                    </View>
                  ) : null}
                  {s.officer ? (
                    <View style={styles.officerCard}>
                      <View style={styles.officerAvatar}>
                        <Text style={[styles.officerAvatarText, { fontFamily: fonts.bold }]}>
                          {String(s.officer).trim().slice(0, 1) || 'O'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.officerKicker, { fontFamily: fonts.bold }]}>{t('assignedOfficer')}</Text>
                        <Text style={[styles.officerName, { fontFamily: fonts.bold }]}>{s.officer}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.helpBtn}>
          <Pressable onPress={() => Linking.openURL('tel:100')} style={({ pressed }) => [styles.helpPress, pressed ? styles.pressed : null]}>
            <Text style={[styles.helpText, { fontFamily: fonts.bold }]}>{t('contactSupport')}</Text>
          </Pressable>
        </LinearGradient>
      </ScrollView>

      {c.image_url ? (
        <Modal visible={imgOpen} transparent animationType="fade" onRequestClose={() => setImgOpen(false)}>
          <Pressable style={styles.modalBg} onPress={() => setImgOpen(false)}>
            <Image source={{ uri: mediaUrl(c.image_url) }} style={styles.modalImg} resizeMode="contain" />
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function buildTimelineSteps(c, timeline, t) {
  const status = c?.status;
  const officer = c?.assigned_officer_name;

  const fmt = (d) => {
    try {
      const dt = new Date(d);
      if (!d || Number.isNaN(dt.getTime())) return '';
      return dt.toLocaleString();
    } catch {
      return '';
    }
  };

  const find = (needle) =>
    (timeline || []).find((ev) => String(ev.title || '').toLowerCase().includes(needle));

  const regEv = find('register') || find('नोंद');
  const assignedEv = find('assign') || find('नियुक्त');
  const progressEv = find('progress') || find('प्रगती');
  const resolvedEv = find('resolve') || find('निकाल') || find('completed');

  const registeredDone = Boolean(regEv || c?.created_at);
  const assignedDone = Boolean(assignedEv || officer);
  const resolvedDone = status === 'resolved' || status === 'completed';
  const inProgressActive = !resolvedDone && (status === 'in_progress' || status === 'assigned' || assignedDone);

  return [
    {
      key: 'registered',
      title: t('complaintStepRegistered'),
      meta: fmt(regEv?.created_at || c?.created_at) || t('registered'),
      state: registeredDone ? 'done' : 'inactive',
      icon: <Check size={16} color="#fff" />,
    },
    {
      key: 'assigned',
      title: t('complaintStepAssigned'),
      meta: fmt(assignedEv?.created_at) || (assignedDone ? t('assigned') : t('pending')),
      state: assignedDone ? 'done' : inProgressActive ? 'active' : 'inactive',
      officer: officer || null,
      icon: <User size={16} color="#fff" />,
    },
    {
      key: 'progress',
      title: t('complaintStepInProgress'),
      meta: progressEv?.created_at ? fmt(progressEv.created_at) : inProgressActive ? t('current') : t('pending'),
      note: progressEv?.description || (inProgressActive ? t('complaintInProgressNote') : null),
      state: inProgressActive ? 'active' : resolvedDone ? 'done' : 'inactive',
      icon: <RefreshCw size={16} color="#fff" />,
    },
    {
      key: 'resolved',
      title: t('complaintStepResolved'),
      meta: resolvedEv?.created_at ? fmt(resolvedEv.created_at) : resolvedDone ? t('done') : t('pending'),
      state: resolvedDone ? 'done' : 'inactive',
      icon: <Check size={16} color={resolvedDone ? '#fff' : 'rgba(90,92,92,0.4)'} />,
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
  identity: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  idKicker: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#5a5c5c' },
  idValue: { fontSize: 26, color: '#2d2f2f', marginTop: 2 },

  detailsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  title: { fontSize: 20, color: '#2d2f2f', marginBottom: 10 },
  desc: { fontSize: 13, color: '#5a5c5c', lineHeight: 20 },
  metaRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f1f1', flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  metaText: { fontSize: 12, color: '#5a5c5c' },

  sectionBlock: { gap: 10 },
  sectionKicker: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#5a5c5c', paddingHorizontal: 4 },

  attachment: { borderRadius: 20, overflow: 'hidden', aspectRatio: 16 / 9, backgroundColor: '#e7e8e8', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  attachmentImg: { width: '100%', height: '100%' },
  attachmentShade: { position: 'absolute', inset: 0, backgroundColor: 'transparent' },
  fullBtn: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(255,255,255,0.20)', padding: 10, borderRadius: 999 },

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
  officerCard: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  officerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e1e3e3', alignItems: 'center', justifyContent: 'center' },
  officerAvatarText: { color: '#2d2f2f', fontSize: 16 },
  officerKicker: { fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', color: '#FF8C00' },
  officerName: { marginTop: 1, fontSize: 14, color: '#2d2f2f' },

  helpBtn: { height: 56, borderRadius: 18, overflow: 'hidden', shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 14, elevation: 6, marginTop: 6 },
  helpPress: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  helpText: { color: '#fff', fontSize: 16 },

  pressed: { transform: [{ scale: 0.985 }] },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalImg: { width: '100%', height: '100%' },
});
