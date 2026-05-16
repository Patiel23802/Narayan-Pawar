import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  CalendarDays,
  Bell,
  Mail,
  MapPin,
  Phone,
  Share2,
  Sprout,
  GraduationCap,
  Eye,
} from 'lucide-react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';
import { ProgressBar } from '../components/ProgressBar';
import { useRouter } from 'expo-router';

const REP_FALLBACK = require('../../assets/representative.png');

export function RepresentativeScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const [rep, setRep] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([api.get('/api/representative'), api.get('/api/projects')]);
        setRep(r.data.representative);
        setProjects(p.data.projects || []);
      } catch {
        setRep(null);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const repName = rep?.name || t('repNameDefaultShort');
  const repTitle = rep?.title || t('repTitleDefault');
  const repBio =
    rep?.bio ||
    t('repBioDefault');
  const heroImg = rep?.photo_url ? { uri: mediaUrl(rep.photo_url) } : REP_FALLBACK;

  const officeAddress =
    rep?.office_address || t('repOfficeDefault');
  const phones =
    rep?.phone || t('repPhoneDefault');
  const email = rep?.email || 'contact@narayanpawar.in';

  const onShare = async () => {
    try {
      await Share.share({
        message: `${repName}\n${repTitle}\n\n${repBio}`,
      });
    } catch {
      // ignore
    }
  };

  const onContactMail = () => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  const onCall = () => {
    const first = String(rep?.phone || '').split('|')[0]?.trim();
    const num = (first || '').replace(/[^\d+]/g, '');
    if (!num) return;
    Linking.openURL(`tel:${num}`);
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroImgWrap}>
              <Image source={heroImg} style={styles.heroImg} />
            </View>
            <View style={styles.heroText}>
              <View style={styles.heroChip}>
                <Text style={[styles.heroChipText, { fontFamily: fonts.bold }]}>{t('yourRepresentative')}</Text>
              </View>
              <Text style={[styles.heroName, { fontFamily: fonts.bold }]}>{repName}</Text>
              <Text style={[styles.heroTitle, { fontFamily: fonts.bold }]}>{repTitle}</Text>
              <Text style={[styles.heroBio, { fontFamily: fonts.medium }]}>{repBio}</Text>

              <View style={styles.heroActionsRow}>
                <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryCta}>
                  <Pressable onPress={onContactMail} style={({ pressed }) => [styles.primaryCtaPress, pressed ? styles.pressed : null]}>
                    <Mail size={18} color="#fff" />
                    <Text style={[styles.primaryCtaText, { fontFamily: fonts.bold }]}>{t('contactNow')}</Text>
                  </Pressable>
                </LinearGradient>

                <View style={styles.heroIconRow}>
                  <Pressable onPress={onShare} style={({ pressed }) => [styles.squareIcon, pressed ? styles.squarePressed : null]}>
                    <Share2 size={20} color="#FF8C00" />
                  </Pressable>
                  <Pressable onPress={onCall} style={({ pressed }) => [styles.squareIcon, pressed ? styles.squarePressed : null]}>
                    <Phone size={20} color="#FF8C00" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.vision}>
            <View style={styles.visionBgBlob} />
            <Text style={[styles.visionTitle, { fontFamily: fonts.bold }]}>
              <Eye size={26} color="#FF8C00" />  {t('visionTitle')}
            </Text>
            <Text style={[styles.visionQuote, { fontFamily: fonts.medium }]}>
              {t('visionQuote')}
            </Text>

            <View style={styles.visionGrid}>
              <View style={styles.visionItem}>
                <View style={styles.visionIcon}>
                  <Sprout size={18} color="#FF8C00" />
                </View>
                <Text style={[styles.visionItemTitle, { fontFamily: fonts.bold }]}>{t('visionItem1Title')}</Text>
                <Text style={[styles.visionItemText, { fontFamily: fonts.medium }]}>
                  {t('visionItem1Text')}
                </Text>
              </View>
              <View style={styles.visionItem}>
                <View style={styles.visionIcon}>
                  <GraduationCap size={18} color="#FF8C00" />
                </View>
                <Text style={[styles.visionItemTitle, { fontFamily: fonts.bold }]}>{t('visionItem2Title')}</Text>
                <Text style={[styles.visionItemText, { fontFamily: fonts.medium }]}>
                  {t('visionItem2Text')}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.achTitle, { fontFamily: fonts.bold }]}>{t('developmentHighlightsTitle')}</Text>
          <View style={styles.achGrid}>
            {(projects || []).slice(0, 3).map((p, idx) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/(tabs)/work/${p.id}`)}
                style={idx === 0 ? styles.achFeatured : styles.achSmall}
              >
                <View style={styles.achCard}>
                  <View style={styles.achImgWrap}>
                    {p.image_url ? (
                      <Image source={{ uri: mediaUrl(p.image_url) }} style={styles.achImg} />
                    ) : (
                      <View style={[styles.achImg, { backgroundColor: '#e7e8e8' }]} />
                    )}
                  </View>
                  <View style={styles.achBody}>
                    <View style={styles.achRow}>
                      <Text style={[styles.achName, { fontFamily: fonts.bold }]} numberOfLines={2}>
                        {p.title}
                      </Text>
                      <View style={[styles.donePill, p.progress_percent >= 100 ? styles.donePillOn : null]}>
                        <Text style={[styles.doneText, { fontFamily: fonts.bold }]}>
                          {p.progress_percent >= 100 ? t('done') : t('progress')}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.achDesc, { fontFamily: fonts.medium }]} numberOfLines={3}>
                      {p.description || t('projectDescFallback')}
                    </Text>
                    <ProgressBar value={p.progress_percent || 0} />
                    <View style={styles.dateRow}>
                      <CalendarDays size={14} color="#5a5c5c" />
                      <Text style={[styles.dateText, { fontFamily: fonts.medium }]} numberOfLines={1}>
                        {t('expectedPrefix')}: {p.expected_completion_date || '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.contact}>
            <Text style={[styles.contactTitle, { fontFamily: fonts.bold }]}>{t('contactAndSocial')}</Text>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <MapPin size={18} color="#FF8C00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactH, { fontFamily: fonts.bold }]}>{t('publicRelationsOffice')}</Text>
                <Text style={[styles.contactP, { fontFamily: fonts.medium }]}>{officeAddress}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Phone size={18} color="#FF8C00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactH, { fontFamily: fonts.bold }]}>{t('contactNumber')}</Text>
                <Text style={[styles.contactP, { fontFamily: fonts.medium }]}>{phones}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Mail size={18} color="#FF8C00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactH, { fontFamily: fonts.bold }]}>{t('email')}</Text>
                <Text style={[styles.contactP, { fontFamily: fonts.medium }]}>{email}</Text>
              </View>
            </View>

            <Pressable onPress={() => router.push('/(tabs)/home/emergency')} style={({ pressed }) => [styles.emergencyBtn, pressed ? styles.pressed : null]}>
              <Text style={[styles.emergencyText, { fontFamily: fonts.bold }]}>{t('emergencyCta')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f6f6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  topTitle: { color: '#fff', fontSize: 20, flexShrink: 1 },

  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 },

  hero: { gap: 16, marginBottom: 22 },
  heroImgWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#e7e8e8',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
    transform: [{ rotate: '-2deg' }],
  },
  heroImg: { width: '100%', height: '100%' },
  heroText: { paddingTop: 8 },
  heroChip: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#ffedd5' },
  heroChipText: { color: '#FF8C00', fontSize: 12 },
  heroName: { fontSize: 44, lineHeight: 48, color: '#2d2f2f', marginTop: 12 },
  heroTitle: { fontSize: 18, color: '#FF8C00', marginTop: 8 },
  heroBio: { marginTop: 14, fontSize: 16, color: '#5a5c5c', lineHeight: 24 },

  heroActionsRow: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'center' },
  primaryCta: { flex: 1, height: 56, borderRadius: 16, overflow: 'hidden', shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  primaryCtaPress: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  primaryCtaText: { color: '#fff', fontSize: 15 },
  heroIconRow: { flexDirection: 'row', gap: 10 },
  squareIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#dbdddd', alignItems: 'center', justifyContent: 'center' },
  squarePressed: { backgroundColor: '#e7e8e8' },
  pressed: { transform: [{ scale: 0.985 }] },

  vision: { marginTop: 10, marginBottom: 24, backgroundColor: '#f0f1f1', borderRadius: 40, padding: 18, overflow: 'hidden' },
  visionBgBlob: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -120, top: -120, backgroundColor: 'rgba(255,140,0,0.10)' },
  visionTitle: { fontSize: 22, color: '#2d2f2f', marginBottom: 12 },
  visionQuote: { fontSize: 18, color: '#2d2f2f', lineHeight: 26, fontStyle: 'italic', borderLeftWidth: 4, borderLeftColor: '#FF8C00', paddingLeft: 14 },
  visionGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  visionItem: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  visionIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  visionItemTitle: { color: '#FF8C00', fontSize: 14, marginBottom: 6 },
  visionItemText: { color: '#5a5c5c', fontSize: 12, lineHeight: 18 },

  achTitle: { fontSize: 22, color: '#2d2f2f', marginBottom: 12 },
  achGrid: { gap: 14 },
  achFeatured: {},
  achSmall: {},
  achCard: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  achImgWrap: { height: 180, backgroundColor: '#e7e8e8' },
  achImg: { width: '100%', height: '100%' },
  achBody: { padding: 16 },
  achRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  achName: { flex: 1, fontSize: 18, color: '#2d2f2f' },
  donePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e7e8e8' },
  donePillOn: { backgroundColor: '#dcfce7' },
  doneText: { fontSize: 11, color: '#176a21' },
  achDesc: { color: '#5a5c5c', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dateText: { color: '#5a5c5c', fontSize: 12, flex: 1 },

  contact: { marginTop: 24, gap: 14 },
  contactTitle: { fontSize: 22, color: '#2d2f2f' },
  contactItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  contactIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e7e8e8', alignItems: 'center', justifyContent: 'center' },
  contactH: { fontSize: 16, color: '#2d2f2f', marginBottom: 4 },
  contactP: { color: '#5a5c5c', fontSize: 13, lineHeight: 18 },
  emergencyBtn: { marginTop: 6, height: 56, borderRadius: 16, backgroundColor: '#FF8C00', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF8C00', shadowOpacity: 0.22, shadowRadius: 16, elevation: 6 },
  emergencyText: { color: '#fff', fontSize: 15 },
});
