import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CalendarDays, Mail, MapPin, EllipsisVertical, Pencil, PhoneCall, Save, User, Users, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radii } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { api, postFormData } from '../services/api';
import { mediaUrl } from '../utils/mediaUrl';
import { useRouter } from 'expo-router';

export function ProfileScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const { user, refreshMe, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    gender: '',
    dob: '',
    address: '',
    ward_no: '',
    city: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/users/profile');
        const u = res.data.user;
        setForm({
          full_name: u.full_name || '',
          email: u.email || '',
          mobile: u.mobile || '',
          gender: u.gender || '',
          dob: u.dob || '',
          address: u.address || '',
          ward_no: u.ward_no || '42',
          city: u.city || '',
        });
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const wardLine = () => {
    const wardNo = (form.ward_no || '').trim();
    const city = (form.city || '').trim();
    const ward = wardNo ? `${t('wardNoPrefix')} ${wardNo}` : t('ward');
    const place = city || t('cityDefault');
    return `${ward}, ${place}`;
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      mediaTypes: ImagePicker.MediaType.Images,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const data = new FormData();
    const ext = asset.uri.split('.').pop() || 'jpg';
    data.append('avatar', {
      uri: asset.uri,
      name: `avatar.${ext}`,
      type: asset.mimeType || 'image/jpeg',
    });
    try {
      await postFormData('/api/users/upload-avatar', data);
      await refreshMe();
    } catch (e) {
      Alert.alert(t('error'), e.message);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/users/profile', {
        full_name: form.full_name,
        email: form.email,
        gender: form.gender,
        dob: form.dob || null,
        address: form.address,
        ward_no: form.ward_no,
        city: form.city,
      });
      await refreshMe();
      Alert.alert('', t('savedSuccessfully'));
    } catch (e) {
      Alert.alert(t('error'), e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

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
              {t('myProfile')}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert(t('options'), '', [
                {
                  text: t('logout'),
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    router.replace('/(auth)/sign-up');
                  },
                },
                { text: t('cancel'), style: 'cancel' },
              ])
            }
            style={({ pressed }) => [styles.iconBtn, pressed ? styles.iconBtnPressed : null]}
            hitSlop={10}
          >
            <EllipsisVertical size={22} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarFrame}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.ph]}>
                    <Text style={{ fontFamily: fonts.bold, color: '#FF8C00', fontSize: 34 }}>
                      {(form.full_name || 'U').slice(0, 1)}
                    </Text>
                  </View>
                )}
              </View>
              <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.editFab}>
                <Pressable onPress={pickAvatar} style={styles.editFabPress} hitSlop={10}>
                  <Pencil color="#fff" size={18} />
                </Pressable>
              </LinearGradient>
            </View>

            <View style={styles.nameBlock}>
              <Text style={[styles.name, { fontFamily: fonts.bold }]} numberOfLines={2}>
                {form.full_name || '—'}
              </Text>
              <Text style={[styles.wardLine, { fontFamily: fonts.bold }]} numberOfLines={2}>
                {wardLine()}
              </Text>
            </View>
          </View>

          <View style={styles.formWrap}>
            <View style={styles.card}>
              <Field
                icon={<User size={14} color="#FF8C00" />}
                label={t('name')}
                value={form.full_name}
                onChangeText={(v) => setField('full_name', v)}
                placeholder="Nimesh Laxman Pashte"
                fonts={fonts}
              />
              <Field
                icon={<Mail size={14} color="#FF8C00" />}
                label={t('email')}
                value={form.email}
                onChangeText={(v) => setField('email', v)}
                keyboardType="email-address"
                fonts={fonts}
              />
              <Field
                icon={<PhoneCall size={14} color="#FF8C00" />}
                label={t('phone')}
                value={form.mobile ? `+91 ${form.mobile}` : ''}
                editable={false}
                fonts={fonts}
              />
            </View>

            <View style={styles.card}>
              <Text style={[styles.fieldLabelRow, { fontFamily: fonts.bold }]}>
                <Text> </Text>
              </Text>

              <View style={styles.genderBlock}>
                <View style={styles.genderLabelRow}>
                  <Users size={14} color="#FF8C00" />
                  <Text style={[styles.fieldLabelText, { fontFamily: fonts.bold }]}>{t('gender')}</Text>
                </View>
                <View style={styles.genderRow}>
                  <Pressable
                    onPress={() => setField('gender', 'male')}
                    style={({ pressed }) => [
                      styles.genderBtn,
                      form.gender === 'male' ? styles.genderBtnActive : styles.genderBtnInactive,
                      pressed ? styles.genderPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        { fontFamily: fonts.bold },
                        form.gender === 'male' ? styles.genderTextActive : styles.genderTextInactive,
                      ]}
                    >
                      {t('male')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setField('gender', 'female')}
                    style={({ pressed }) => [
                      styles.genderBtn,
                      form.gender === 'female' ? styles.genderBtnActive : styles.genderBtnInactive,
                      pressed ? styles.genderPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        { fontFamily: fonts.bold },
                        form.gender === 'female' ? styles.genderTextActive : styles.genderTextInactive,
                      ]}
                    >
                      {t('female')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Field
                icon={<CalendarDays size={14} color="#FF8C00" />}
                label={t('dob')}
                value={form.dob}
                onChangeText={(v) => setField('dob', v)}
                placeholder="YYYY-MM-DD"
                fonts={fonts}
              />

              <Field
                icon={<MapPin size={14} color="#FF8C00" />}
                label={t('address')}
                value={form.address}
                onChangeText={(v) => setField('address', v)}
                multiline
                numberOfLines={3}
                fonts={fonts}
              />
            </View>

            <LinearGradient colors={['#FF8C00', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBtn}>
              <Pressable
                disabled={saving}
                onPress={save}
                style={({ pressed }) => [styles.saveBtnPress, pressed ? styles.savePressed : null]}
              >
                <Save size={22} color="#fff" />
                <Text style={[styles.saveText, { fontFamily: fonts.bold }]}>{t('save')}</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  multiline = false,
  numberOfLines,
  fonts,
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        {icon}
        <Text style={[styles.fieldLabelText, { fontFamily: fonts.bold }]}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#767777"
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          { fontFamily: fonts.bold },
          !editable ? styles.inputDisabled : null,
          multiline ? styles.textarea : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f6f6' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 14,
    shadowColor: '#7c2d12',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBtn: { padding: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.0)' },
  iconBtnPressed: { backgroundColor: 'rgba(255,255,255,0.10)' },
  topTitle: { fontSize: 20, color: '#fff', flexShrink: 1 },

  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 },

  profileHeader: { alignItems: 'center', marginBottom: 18 },
  avatarOuter: { position: 'relative', marginBottom: 12 },
  avatarFrame: {
    width: 128,
    height: 128,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#dbdddd',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
    transform: [{ rotate: '-2deg' }],
  },
  avatar: { width: '100%', height: '100%' },
  ph: {
    backgroundColor: '#dbdddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFab: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#f6f6f6',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ rotate: '4deg' }],
  },
  editFabPress: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  nameBlock: { marginTop: 14, alignItems: 'center' },
  name: { fontSize: 30, color: '#2d2f2f', textAlign: 'center' },
  wardLine: { fontSize: 14, color: '#FF8C00', marginTop: 6, textAlign: 'center' },

  formWrap: { gap: 16, marginTop: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 16,
    gap: 16,
    borderTopWidth: 4,
    borderTopColor: '#FF8C00',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  field: { gap: 10 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  fieldLabelText: { fontSize: 14, color: '#FF8C00' },
  input: {
    backgroundColor: '#f0f1f1',
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2d2f2f',
  },
  inputDisabled: { opacity: 0.9 },
  textarea: { minHeight: 92 },

  genderBlock: { gap: 10 },
  genderLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, borderRadius: radii.lg, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  genderBtnActive: {
    backgroundColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  genderBtnInactive: { backgroundColor: '#f0f1f1' },
  genderPressed: { transform: [{ scale: 0.98 }] },
  genderText: { fontSize: 14 },
  genderTextActive: { color: '#fff' },
  genderTextInactive: { color: '#5a5c5c' },

  saveBtn: {
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF8C00',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  saveBtnPress: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  savePressed: { transform: [{ scale: 0.985 }] },
  saveText: { color: '#fff', fontSize: 18 },
});
