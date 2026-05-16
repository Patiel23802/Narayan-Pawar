import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Eye, EyeOff, Info, KeyRound, Save, ShieldCheck } from 'lucide-react-native';
import { colors, radii, spacing } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { getApiErrorMessage } from '../utils/apiErrors';

const ILLUSTRATION_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBklVvpRyIr-nHz8RQzcBCKX11YZ_N4__E98214Uw1SoCL2X9QT6ztnBdNOrBXUVkLsfxk6ZGD3Z3NnL1pUhbZLpghYxY7PVYNVkHigFyHvEcAva11NWfFdCx-3HoW8SXXAwwLO93oSmk8RQ5ct70PvPesPNz0ygPYyCAvMeYynr16yx24XA_wDujGwO4qdDr3EI_VgdWLPoUP2DFaZqJzYN_hcuA33hOS5Ux8oKEeSzXAhHyPzD15uxJRp2a0X37cHVYgLAPD_VwEy';

export function PasswordSetupScreen() {
  const router = useRouter();
  const { t, fonts } = useLocale();
  const { setPassword } = useAuth();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (p1.length < 6) {
      Alert.alert(t('error'), t('passwordMin6'));
      return;
    }
    if (p1 !== p2) {
      Alert.alert(t('error'), t('passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await setPassword(p1);
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert(t('error'), getApiErrorMessage(e, t('passwordSaveFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#E67600', '#D95E00', '#F2A45E']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <LinearGradient colors={['#FF6D00', '#FFAB40']} style={styles.brandIconWrap}>
              <KeyRound size={34} color="#fff" />
            </LinearGradient>
            <Text style={[styles.brandTitle, { fontFamily: fonts.bold }]}>{t('passwordTitle')}</Text>
            <Text style={[styles.brandSub, { fontFamily: fonts.medium }]}>{t('passwordBrandSub')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={[styles.h2, { fontFamily: fonts.bold }]}>{t('passwordHint')}</Text>
              <Text style={[styles.p, { fontFamily: fonts.regular }]}>
                {t('passwordSetupSubtitle')}
              </Text>
            </View>

            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={[styles.label, { fontFamily: fonts.bold }]}>{t('password')}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={p1}
                    onChangeText={setP1}
                    placeholder="••••••••"
                    placeholderTextColor="#767777"
                    secureTextEntry={!show}
                    style={[styles.input, { fontFamily: fonts.medium }]}
                  />
                  <Pressable onPress={() => setShow((s) => !s)} style={styles.eyeBtn} hitSlop={10}>
                    {show ? <EyeOff size={20} color="#5a5c5c" /> : <Eye size={20} color="#5a5c5c" />}
                  </Pressable>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { fontFamily: fonts.bold }]}>{t('confirmPassword')}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={p2}
                    onChangeText={setP2}
                    placeholder="••••••••"
                    placeholderTextColor="#767777"
                    secureTextEntry={!show}
                    style={[styles.input, { fontFamily: fonts.medium }]}
                  />
                  <Pressable onPress={() => setShow((s) => !s)} style={styles.eyeBtn} hitSlop={10}>
                    {show ? <EyeOff size={20} color="#5a5c5c" /> : <Eye size={20} color="#5a5c5c" />}
                  </Pressable>
                </View>
              </View>

              <View style={styles.hintRow}>
                <Info size={14} color="#FF6D00" />
                <Text style={[styles.hintText, { fontFamily: fonts.medium }]}>{t('passwordMin6Hint')}</Text>
              </View>

              <Pressable
                disabled={loading}
                onPress={onSave}
                style={({ pressed }) => [styles.primaryBtn, pressed && !loading ? styles.pressed : null]}
              >
                <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>{t('savePassword')}</Text>
                <Save size={20} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.hr} />
              <Text style={[styles.dividerText, { fontFamily: fonts.bold }]}>{t('profile')}</Text>
              <View style={styles.hr} />
            </View>

            <Pressable
              onPress={() => {
                if (p1.length < 6 || p1 !== p2) {
                  Alert.alert(t('info'), t('savePasswordFirst'));
                  return;
                }
                onSave();
              }}
              style={({ pressed }) => [styles.secondaryBtn, pressed ? styles.secondaryPressed : null]}
            >
              <Text style={[styles.secondaryText, { fontFamily: fonts.bold }]}>{t('nextStepCompleteProfile')}</Text>
              <ArrowRight size={20} color="#2d2f2f" />
            </Pressable>
          </View>

          <View style={styles.trustWrap}>
            <View style={styles.trustBadge}>
              <ShieldCheck size={18} color="#176a21" />
              <Text style={[styles.trustText, { fontFamily: fonts.medium }]}>{t('securityBadge')}</Text>
            </View>
          </View>

          <View style={styles.illustrationWrap}>
            <Image source={{ uri: ILLUSTRATION_URI }} resizeMode="contain" style={styles.illustration} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FF8C00' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: 'center',
  },

  brand: { width: '100%', maxWidth: 420, alignItems: 'center', marginBottom: 22 },
  brandIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 18,
  },
  brandTitle: { fontSize: 30, color: '#fff', letterSpacing: -0.4, marginBottom: 6 },
  brandSub: { fontSize: 15, color: 'rgba(255,255,255,0.92)', textAlign: 'center', lineHeight: 20 },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  header: { gap: 6 },
  h2: { fontSize: 20, color: '#2d2f2f' },
  p: { fontSize: 13, color: '#5a5c5c' },

  fields: { marginTop: 16, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 11, color: '#5a5c5c', letterSpacing: 1.1, textTransform: 'uppercase', marginLeft: 4 },
  inputWrap: {
    backgroundColor: '#f0f1f1',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
  },
  input: { height: 56, paddingLeft: 14, paddingRight: 46, fontSize: 15, color: '#2d2f2f' },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },

  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, marginTop: 2 },
  hintText: { fontSize: 12, color: '#5a5c5c' },

  primaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    marginTop: 6,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: '#fff', fontSize: 15 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  hr: { flex: 1, height: 1, backgroundColor: '#e7e8e8' },
  dividerText: { fontSize: 10, color: '#acadad', letterSpacing: 2, textTransform: 'uppercase' },

  secondaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#f0f1f1',
  },
  secondaryPressed: { backgroundColor: '#e7e8e8' },
  secondaryText: { fontSize: 14, color: '#2d2f2f' },

  trustWrap: { width: '100%', maxWidth: 420, alignItems: 'center', marginTop: 18 },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.90)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  trustText: { fontSize: 12, color: '#5a5c5c' },

  illustrationWrap: { marginTop: 34, opacity: 0.8 },
  illustration: { height: 64, width: 240 },
});
