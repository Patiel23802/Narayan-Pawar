import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Pressable,
  ImageBackground,
  TextInput,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Camera, MapPin, Menu, Send, Headphones, BadgeCheck } from 'lucide-react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { api } from '../services/api';
import { useRouter } from 'expo-router';

const MAP_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD1tKFizunZRTh_kPD4wlIQ2CotCOt1c1U5lQZx9oO3psC59lWDcOnRU6UH0t3RnkRkcysgCjQ8fmVUmuhNCBiWTXBi_AYIT9kEhEBwPx6FQcQKI721bs5PLLoi05zOHcJSBz5AYYgOzM6TTk_RVtxMe7S_sdFCkKuNjv6x9JycCOjl7Hb5OYcuRi6xieMCnQy1fZFuhUOujVRLk5L8-WbfSxYqeBFslRWdlhC2VohQtGN-MMvqLu5Gat4lEOjhY_bb9pZxjw9UZWDA';

export function ComplaintRegisterScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('permissionRequired'), t('photoPermissionDeniedMsg'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('openSettings'), onPress: () => Linking.openSettings?.() },
        ]);
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setImage(res.assets[0]);
      }
    } catch (e) {
      Alert.alert(t('error'), e?.message || t('somethingWentWrong'));
    }
  };

  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('permissionRequired'), t('cameraPermissionDeniedMsg'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('openSettings'), onPress: () => Linking.openSettings?.() },
        ]);
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setImage(res.assets[0]);
      }
    } catch (e) {
      Alert.alert(t('error'), e?.message || t('somethingWentWrong'));
    }
  };

  const imageFile = () => {
    if (!image?.uri) return null;
    const nameFromPicker = image.fileName || image.filename;
    const extFromName = nameFromPicker ? String(nameFromPicker).split('.').pop() : null;
    const extFromUri = String(image.uri).split('.').pop();
    const ext = (extFromName || extFromUri || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const type = image.mimeType || (ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg');
    return { uri: image.uri, name: nameFromPicker || `complaint.${ext}`, type };
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert(t('error'), t('complaintTitle'));
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description);
      form.append('location_text', location);
      const file = imageFile();
      if (file) form.append('image', file);
      await api.post('/api/complaints', form, {
        // Let axios set the correct multipart boundary automatically.
        timeout: 60000,
      });
      router.replace('/(tabs)/complaints');
    } catch (e) {
      Alert.alert(t('error'), e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#E67600', '#CC3A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Pressable
              onPress={() => router.replace('/(tabs)/complaints')}
              style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]}
              hitSlop={10}
            >
              <Menu size={22} color="#fff" />
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

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.editorial}>
          <Text style={[styles.kicker, { fontFamily: fonts.bold }]}>{t('wardServiceKicker')}</Text>
          <Text style={[styles.h1, { fontFamily: fonts.bold }]}>{t('registerComplaint')}</Text>
          <Text style={[styles.sub, { fontFamily: fonts.medium }]}>
            {t('registerComplaintSubtitle')}
          </Text>
        </View>

        <View style={styles.canvasOuter}>
          <View style={styles.canvasInner}>
            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: fonts.bold }]}>{t('complaintTitleLabel')}</Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder={t('complaintTitlePlaceholder')}
                fonts={fonts}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: fonts.bold }]}>{t('complaintDescLabel')}</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder={t('complaintDescPlaceholder')}
                fonts={fonts}
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: fonts.bold }]}>{t('uploadImageLabel')}</Text>
              <View style={{ gap: 10 }}>
                <Pressable onPress={pickFromGallery} style={({ pressed }) => [styles.uploadBox, pressed ? styles.pressed : null]}>
                {image?.uri ? (
                  <Image source={{ uri: image.uri }} style={styles.uploadPreview} />
                ) : (
                  <View style={styles.uploadEmpty}>
                    <Camera size={34} color="#FF8C00" />
                    <Text style={[styles.uploadText, { fontFamily: fonts.medium }]}>{t('tapToPickPhoto')}</Text>
                  </View>
                )}
                </Pressable>
                <Pressable onPress={pickFromCamera} style={({ pressed }) => [styles.cameraBtn, pressed ? styles.pressed : null]}>
                  <Camera size={18} color="#fff" />
                  <Text style={[styles.cameraBtnText, { fontFamily: fonts.bold }]}>{t('openCamera')}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: fonts.bold }]}>{t('locationLabel')}</Text>
              <View style={styles.locWrap}>
                <MapPin size={18} color="#FF8C00" />
                <Input
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('locationPlaceholder')}
                  fonts={fonts}
                  style={styles.locInput}
                />
              </View>
            </View>

            <ImageBackground source={{ uri: MAP_BG }} style={styles.mapCard} imageStyle={styles.mapImg}>
              <View style={styles.mapOverlay}>
                <View style={styles.mapPill}>
                  <MapPin size={14} color="#FF8C00" />
                  <Text style={[styles.mapPillText, { fontFamily: fonts.bold }]}>{t('confirmCurrentLocation')}</Text>
                </View>
              </View>
            </ImageBackground>

            <View style={styles.submitWrap}>
              <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                <Pressable
                  disabled={loading}
                  onPress={submit}
                  style={({ pressed }) => [styles.submitPress, pressed ? styles.pressed : null]}
                >
                  <Text style={[styles.submitText, { fontFamily: fonts.bold }]}>{t('submitComplaint')}</Text>
                  <Send size={18} color="#fff" />
                </Pressable>
              </LinearGradient>
              <Text style={[styles.submitHint, { fontFamily: fonts.medium }]}>
                {t('submitComplaintHint')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.supportGrid}>
          <View style={styles.supportCard}>
            <View style={styles.supportIconA}>
              <Headphones size={18} color="#FF8C00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportTitle, { fontFamily: fonts.bold }]}>{t('needHelp')}</Text>
              <Text style={[styles.supportText, { fontFamily: fonts.medium }]}>
                {t('helplineText')}
              </Text>
            </View>
          </View>
          <View style={styles.supportCard}>
            <View style={styles.supportIconB}>
              <BadgeCheck size={18} color="#176a21" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportTitle, { fontFamily: fonts.bold }]}>{t('transparencyCard')}</Text>
              <Text style={[styles.supportText, { fontFamily: fonts.medium }]}>
                {t('transparencyHint')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Input({ value, onChangeText, placeholder, fonts, multiline, style }) {
  return (
    <View style={[styles.inputWrap, multiline ? styles.inputWrapMulti : null, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#767777"
        multiline={multiline}
        style={[
          styles.input,
          { fontFamily: fonts.medium },
          multiline ? styles.inputMulti : null,
        ]}
      />
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

  editorial: { marginBottom: 14 },
  kicker: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#FF8C00', marginBottom: 8 },
  h1: { fontSize: 32, color: '#2d2f2f', letterSpacing: -0.4 },
  sub: { fontSize: 16, color: '#5a5c5c', marginTop: 8, lineHeight: 22 },

  canvasOuter: { backgroundColor: '#f0f1f1', borderRadius: 32, padding: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  canvasInner: { backgroundColor: '#fff', borderRadius: 28, padding: 16, gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 14, color: '#5a5c5c', marginLeft: 4 },

  inputWrap: { backgroundColor: '#f0f1f1', borderRadius: radii.lg },
  inputWrapMulti: {},
  input: { paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: '#2d2f2f' },
  inputMulti: { minHeight: 120, textAlignVertical: 'top' },

  uploadBox: { height: 160, borderRadius: 24, backgroundColor: '#f0f1f1', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(172,173,173,0.35)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  uploadEmpty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 14 },
  uploadText: { color: '#5a5c5c', fontSize: 13, textAlign: 'center' },
  uploadPreview: { width: '100%', height: '100%' },

  cameraBtn: { height: 44, borderRadius: 14, backgroundColor: '#FF8C00', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  cameraBtnText: { color: '#fff', fontSize: 14 },

  locWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0f1f1', borderRadius: radii.lg, paddingHorizontal: 14 },
  locInput: { flex: 1 },

  mapCard: { height: 192, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e7e8e8' },
  mapImg: { opacity: 0.6 },
  mapOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.90)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  mapPillText: { fontSize: 12, color: '#2d2f2f' },

  submitWrap: { paddingTop: 4, gap: 10 },
  submitBtn: { height: 56, borderRadius: 18, overflow: 'hidden', shadowColor: '#FF8C00', shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
  submitPress: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#fff', fontSize: 16 },
  submitHint: { textAlign: 'center', fontSize: 12, color: '#5a5c5c' },

  supportGrid: { marginTop: 14, gap: 12 },
  supportCard: { backgroundColor: '#e7e8e8', borderRadius: 20, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  supportIconA: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,140,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  supportIconB: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(23,106,33,0.10)', alignItems: 'center', justifyContent: 'center' },
  supportTitle: { fontSize: 15, color: '#2d2f2f' },
  supportText: { marginTop: 4, fontSize: 12, color: '#5a5c5c', lineHeight: 18 },

  pressed: { transform: [{ scale: 0.985 }] },
});
