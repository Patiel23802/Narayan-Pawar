import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Menu, Phone, Flame, Droplets, Bolt, Hospital, BadgeAlert, MapPin } from 'lucide-react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { useRouter } from 'expo-router';

const MAP_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuArnPTAkYFfx3E-pZwV_XBZJvR7a9PcWf-KWJYXkmAZK1pwODFMxFWytxnLesaFStVenkzc13dw_pKJfq5Ld9no1H_d6mGzmKQzUAigwkqGGRH66a46T3bwdX6cbc1PD9rzb9gCHu0IMOfuddiQiVk3ryn5WYoDjwqjBMogHyz6d34X_7MuJLHOwZ-vhpF9tXUSJFEAxtY4p8En5RbkfafSVNtGVOmb5FFNNxMMJ1A6_AoXPD0z0rHP7vH5l9DpAjuLJ4XJ3qm4Q_ME';

export function EmergencyScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/emergency-contacts');
        setItems(res.data.contacts || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const main = items[0];
  const rest = items.slice(1);

  const dial = (phone) => {
    const p = String(phone || '');
    const num = p.replace(/[^\d+]/g, '');
    if (!num) return;
    Linking.openURL(`tel:${num}`);
  };

  const byKey = (key, fallback) => {
    const found = rest.find((x) => (x.department_name || '').toLowerCase().includes(key));
    return found || fallback;
  };

  const office = main || {
    department_name: t('publicRelationsOffice'),
    phone: '+९१ २२ २३४५ ६७८९',
    description: t('publicRelationsDesc'),
  };
  const police = byKey('police', { department_name: t('policeStation'), phone: '100', description: t('policeDesc') });
  const health = byKey('health', { department_name: t('healthService'), phone: '+९१ ९८७६५ ४३२१०' });
  const fire = byKey('fire', { department_name: t('fireBrigade'), phone: '101', description: t('fireDesc') });
  const water = byKey('water', { department_name: t('waterDepartment'), phone: '+९१ २२ ७६५४ ३२१०' });
  const electricity = byKey('electric', { department_name: t('electricityBoard'), phone: '1912', description: t('electricityDesc') });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#E67600', '#F08A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
              style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]}
              hitSlop={10}
            >
              <Menu size={22} color="#fff" />
            </Pressable>
            <Text style={[styles.topTitle, { fontFamily: fonts.bold }]} numberOfLines={1}>
              {t('importantContacts')}
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
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.heroHead}>
            <View>
              <Text style={[styles.heroTitle, { fontFamily: fonts.bold }]}>{t('emergencyContacts')}</Text>
            </View>
            <Text style={[styles.heroTag, { fontFamily: fonts.bold }]}>Emergency</Text>
          </View>

          <View style={styles.bento}>
            <View style={styles.officeCard}>
              <View style={styles.officeBgIcon}>
                <BadgeAlert size={90} color="rgba(0,0,0,0.08)" />
              </View>
              <View style={styles.officeChip}>
                <Text style={[styles.officeChipText, { fontFamily: fonts.bold }]}>{t('mainOffice')}</Text>
              </View>
              <Text style={[styles.officeTitle, { fontFamily: fonts.bold }]}>{office.department_name}</Text>
              <Text style={[styles.officeSub, { fontFamily: fonts.medium }]}>{office.description}</Text>

              <View style={styles.officeBottom}>
                <Text style={[styles.officePhone, { fontFamily: fonts.bold }]}>{office.phone}</Text>
                <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.callCta}>
                  <Pressable onPress={() => dial(office.phone)} style={({ pressed }) => [styles.callCtaPress, pressed ? styles.pressed : null]}>
                    <Phone size={18} color="#fff" />
                    <Text style={[styles.callCtaText, { fontFamily: fonts.bold }]}>{t('tapToCall')}</Text>
                  </Pressable>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.policeCard}>
              <View style={styles.policeTop}>
                <View style={styles.policeIcon}>
                  <BadgeAlert size={30} color="#FF8C00" />
                </View>
                <Text style={[styles.policeHot, { fontFamily: fonts.bold }]}>१००</Text>
              </View>
              <Text style={[styles.policeTitle, { fontFamily: fonts.bold }]}>{police.department_name}</Text>
              <Text style={[styles.policeSub, { fontFamily: fonts.medium }]}>{police.description}</Text>

              <Pressable onPress={() => dial(police.phone)} style={({ pressed }) => [styles.policeCta, pressed ? styles.pressed : null]}>
                <Phone size={18} color="#FF8C00" />
                <Text style={[styles.policeCtaText, { fontFamily: fonts.bold }]}>{t('tapToCall')}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold }]}>{t('servicesAndDepartments')}</Text>

          <View style={styles.services}>
            <ServiceCard title={t('healthService')} phone={health.phone} Icon={Hospital} fonts={fonts} onPress={() => dial(health.phone)} />
            <ServiceCard title={t('fireBrigade')} phone={fire.description || fire.phone} Icon={Flame} fonts={fonts} onPress={() => dial(fire.phone)} />
            <ServiceCard title={t('waterDepartment')} phone={water.phone} Icon={Droplets} fonts={fonts} onPress={() => dial(water.phone)} />
            <ServiceCard title={t('electricityBoard')} phone={electricity.description || electricity.phone} Icon={Bolt} fonts={fonts} onPress={() => dial(electricity.phone)} />
          </View>

          <ImageBackground source={{ uri: MAP_BG }} style={styles.mapCard} imageStyle={styles.mapImg}>
            <LinearGradient colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.92)']} style={styles.mapFade}>
              <View style={styles.mapPin}>
                <MapPin size={22} color="#FF8C00" />
              </View>
              <Text style={[styles.mapTitle, { fontFamily: fonts.bold }]}>{t('nearbyOfficesMap')}</Text>
              <Pressable
                onPress={() => Linking.openURL('https://maps.google.com')}
                style={({ pressed }) => [styles.mapBtn, pressed ? styles.mapBtnPressed : null]}
              >
                <Text style={[styles.mapBtnText, { fontFamily: fonts.bold }]}>{t('openMap')}</Text>
              </Pressable>
            </LinearGradient>
          </ImageBackground>
        </ScrollView>
      )}
    </View>
  );
}

function ServiceCard({ title, phone, Icon, fonts, onPress }) {
  const { t } = useLocale();
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceIcon}>
        <Icon size={30} color="#FF8C00" />
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[styles.serviceTitle, { fontFamily: fonts.bold }]}>{title}</Text>
        <Text style={[styles.servicePhone, { fontFamily: fonts.bold }]}>{phone}</Text>
        <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.serviceCta}>
          <Pressable onPress={onPress} style={({ pressed }) => [styles.serviceCtaPress, pressed ? styles.pressed : null]}>
            <Phone size={16} color="#fff" />
            <Text style={[styles.serviceCtaText, { fontFamily: fonts.bold }]}>{t('tapToCall')}</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f6f6' },
  topBar: { paddingTop: 52, paddingBottom: 12, paddingHorizontal: 14, shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 18, elevation: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBtn: { padding: 8, borderRadius: 999 },
  iconBtnPressed: { backgroundColor: 'rgba(255,255,255,0.10)' },
  topTitle: { color: '#fff', fontSize: 20, flexShrink: 1 },

  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 },
  heroHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 },
  heroTitle: { fontSize: 28, color: '#2d2f2f' },
  heroTag: { color: '#FF8C00', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },

  bento: { gap: 14, marginBottom: 22 },
  officeCard: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f1f1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  officeBgIcon: { position: 'absolute', top: -10, right: -4, opacity: 0.14 },
  officeChip: { alignSelf: 'flex-start', backgroundColor: '#ffedd5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginBottom: 12 },
  officeChipText: { color: '#FF8C00', fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' },
  officeTitle: { fontSize: 28, color: '#2d2f2f' },
  officeSub: { marginTop: 6, fontSize: 15, color: '#5a5c5c' },
  officeBottom: { marginTop: 14, gap: 12 },
  officePhone: { fontSize: 22, color: '#FF8C00' },
  callCta: { height: 56, borderRadius: 18, overflow: 'hidden', shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
  callCtaPress: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  callCtaText: { color: '#fff', fontSize: 14 },

  policeCard: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f0f1f1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  policeTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  policeIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' },
  policeHot: { fontSize: 34, color: '#b02500' },
  policeTitle: { fontSize: 22, color: '#2d2f2f', marginTop: 14 },
  policeSub: { marginTop: 6, fontSize: 13, color: '#5a5c5c' },
  policeCta: { marginTop: 14, height: 56, borderRadius: 18, backgroundColor: '#dbdddd', flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  policeCtaText: { color: '#FF8C00', fontSize: 14 },

  sectionTitle: { fontSize: 22, color: '#2d2f2f', marginBottom: 12 },
  services: { gap: 12, marginBottom: 18 },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f0f1f1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  serviceIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { fontSize: 18, color: '#2d2f2f', textAlign: 'center' },
  servicePhone: { marginTop: 6, fontSize: 13, color: '#5a5c5c' },
  serviceCta: { marginTop: 10, borderRadius: radii.lg, overflow: 'hidden' },
  serviceCtaPress: { paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  serviceCtaText: { color: '#fff', fontSize: 12 },

  mapCard: { height: 224, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f1f1' },
  mapImg: { resizeMode: 'cover', opacity: 0.45 },
  mapFade: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  mapPin: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  mapTitle: { color: '#2d2f2f', fontSize: 16, textAlign: 'center' },
  mapBtn: { paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: '#fed7aa' },
  mapBtnPressed: { borderBottomColor: '#FF8C00' },
  mapBtnText: { color: '#FF8C00', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },

  pressed: { transform: [{ scale: 0.985 }] },
});
