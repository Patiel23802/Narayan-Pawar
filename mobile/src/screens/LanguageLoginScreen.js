import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppCard } from '../components/AppCard';
import { colors, radii, spacing } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import {
  assertFirebaseOtpAvailable,
  confirmFirebasePhoneOtp,
  isFirebaseOnlyOtpMode,
  sendFirebasePhoneOtp,
  shouldUseFirebaseForOtp,
} from '../services/firebasePhoneAuth';
import { getApiErrorMessage } from '../utils/apiErrors';
import { routeAfterAuth } from '../utils/authNavigation';

export function LanguageLoginScreen() {
  const router = useRouter();
  const { locale, setLocale, t, fonts } = useLocale();
  const { checkMobile, sendOtp, verifyOtp, loginWithFirebasePhone, loginPassword } = useAuth();
  const useFirebaseSms = useMemo(() => shouldUseFirebaseForOtp(), []);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('otp');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasPasswordOnServer, setHasPasswordOnServer] = useState(false);

  const lastCheckedMobileRef = useRef('');
  const firebaseConfirmationRef = useRef(null);

  const mobile10 = useMemo(() => String(mobile || '').replace(/\D/g, '').slice(0, 10), [mobile]);
  const setMobile10 = (v) => setMobile(String(v || '').replace(/\D/g, '').slice(0, 10));

  useEffect(() => {
    (async () => {
      const m = mobile10;
      if (m.length !== 10) {
        setOtpSent(false);
        setOtp('');
        setPassword('');
        setHasPasswordOnServer(false);
        setMode('otp');
        lastCheckedMobileRef.current = '';
        return;
      }
      if (lastCheckedMobileRef.current === m) return;
      lastCheckedMobileRef.current = m;
      setChecking(true);
      try {
        const { hasPassword } = await checkMobile(m);
        setHasPasswordOnServer(hasPassword);
        setMode(hasPassword ? 'password' : 'otp');
        setOtpSent(false);
        setOtp('');
        setPassword('');
      } catch {
        setHasPasswordOnServer(false);
        setMode('otp');
      } finally {
        setChecking(false);
      }
    })();
  }, [mobile10, checkMobile]);

  const onSendOtp = async () => {
    if (mobile10.length !== 10) {
      Alert.alert(t('error'), t('enterValidMobile'));
      return;
    }
    setLoading(true);
    try {
      if (isFirebaseOnlyOtpMode()) {
        assertFirebaseOtpAvailable();
        firebaseConfirmationRef.current = await sendFirebasePhoneOtp(mobile10);
      } else if (useFirebaseSms) {
        firebaseConfirmationRef.current = await sendFirebasePhoneOtp(mobile10);
      } else {
        await sendOtp(mobile10);
      }
      setOtpSent(true);
    } catch (e) {
      Alert.alert(t('error'), getApiErrorMessage(e, t('otpSendFailed')));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    const code = otp.replace(/\D/g, '').trim();
    if (mobile10.length !== 10 || code.length < 6) {
      Alert.alert(t('error'), t('otpInvalid'));
      return;
    }
    setLoading(true);
    try {
      let u;
      if (isFirebaseOnlyOtpMode() || (useFirebaseSms && firebaseConfirmationRef.current)) {
        assertFirebaseOtpAvailable();
        if (!firebaseConfirmationRef.current) {
          Alert.alert(t('error'), t('otpSendFailed'));
          return;
        }
        const { idToken } = await confirmFirebasePhoneOtp(firebaseConfirmationRef.current, code);
        firebaseConfirmationRef.current = null;
        u = await loginWithFirebasePhone(idToken);
      } else {
        u = await verifyOtp(mobile10, code);
      }
      routeAfterAuth(router, u);
    } catch (e) {
      Alert.alert(t('error'), getApiErrorMessage(e, t('otpInvalid')));
    } finally {
      setLoading(false);
    }
  };

  const onPasswordLogin = async () => {
    if (mobile10.length !== 10 || !password.trim()) {
      Alert.alert(t('error'), password.trim() ? t('enterValidMobile') : t('enterPassword'));
      return;
    }
    setLoading(true);
    try {
      const u = await loginPassword(mobile10, password);
      routeAfterAuth(router, u);
    } catch (e) {
      Alert.alert(t('error'), getApiErrorMessage(e, t('error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.scroll}>
          <Text style={[styles.title, { fontFamily: fonts.bold }]}>{t('appTitle')}</Text>
          <Text style={[styles.sub, { fontFamily: fonts.regular }]}>{t('appSubtitle')}</Text>

          <View style={styles.langRow}>
            {['mr', 'hi', 'en'].map((code) => (
              <Pressable
                key={code}
                onPress={() => setLocale(code)}
                style={[styles.langChip, locale === code && styles.langChipActive]}
              >
                <Text
                  style={[
                    styles.langText,
                    { fontFamily: fonts.medium },
                    locale === code && styles.langTextActive,
                  ]}
                >
                  {code === 'mr' ? t('marathi') : code === 'hi' ? t('hindi') : t('english')}
                </Text>
              </Pressable>
            ))}
          </View>

          <AppCard style={styles.card}>
            <Text style={[styles.section, { fontFamily: fonts.medium }]}>{t('language')}</Text>
            <AppInput
              label={`${t('mobile')} (+91)`}
              value={mobile}
              onChangeText={setMobile10}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
            />
            {checking ? <Text style={[styles.hint, { fontFamily: fonts.regular }]}>{t('loading')}</Text> : null}

            {mode === 'otp' ? (
              <>
                {!otpSent ? (
                  <AppButton title={t('sendOtp')} onPress={onSendOtp} loading={loading} />
                ) : (
                  <Text style={[styles.hint, { fontFamily: fonts.medium }]}>{t('otpSentSuccess')}</Text>
                )}
                {otpSent ? (
                  <>
                    <AppInput
                      label={t('otp')}
                      value={otp}
                      onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <AppButton title={t('verify')} onPress={onVerify} loading={loading} />
                    <AppButton title={t('resendOtp')} onPress={onSendOtp} loading={loading} variant="secondary" />
                    {useFirebaseSms ? (
                      <Text style={[styles.hint, { fontFamily: fonts.regular }]}>{t('firebaseSmsHint')}</Text>
                    ) : __DEV__ ? (
                      <Text style={[styles.hint, { fontFamily: fonts.regular }]}>{t('devOtpHint')}</Text>
                    ) : (
                      <Text style={[styles.hint, { fontFamily: fonts.regular }]}>{t('smsOtpHint')}</Text>
                    )}
                  </>
                ) : null}
                {hasPasswordOnServer ? (
                  <Pressable
                    onPress={() => {
                      setMode('password');
                      setOtpSent(false);
                      setOtp('');
                    }}
                    style={styles.linkBtn}
                  >
                    <Text style={[styles.linkText, { fontFamily: fonts.bold }]}>{t('usePasswordInstead')}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <>
                <AppInput
                  label={t('password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <AppButton title={t('login')} onPress={onPasswordLogin} loading={loading} />
                <Pressable
                  onPress={() => {
                    setMode('otp');
                    setPassword('');
                    setOtpSent(false);
                    setOtp('');
                  }}
                  style={styles.linkBtn}
                >
                  <Text style={[styles.linkText, { fontFamily: fonts.bold }]}>{t('useOtpInstead')}</Text>
                </Pressable>
                {__DEV__ ? (
                  <Text style={[styles.hint, { fontFamily: fonts.regular }]}>{t('devLoginHint')}</Text>
                ) : null}
              </>
            )}
          </AppCard>

          <View style={styles.bottomRow}>
            <AppCard style={styles.smallCard}>
              <Text style={{ fontFamily: fonts.bold, color: colors.primary }}>{t('wardWork')}</Text>
            </AppCard>
            <AppCard style={styles.smallCard}>
              <Text style={{ fontFamily: fonts.bold, color: colors.primary }}>{t('wardUpdates')}</Text>
            </AppCard>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, padding: spacing.lg, paddingTop: 56, paddingBottom: 24, justifyContent: 'space-between' },
  title: { fontSize: 28, color: '#fff', textAlign: 'center' },
  sub: { fontSize: 15, color: '#fff', textAlign: 'center', marginTop: 6, opacity: 0.95 },
  langRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: spacing.lg },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.25)' },
  langChipActive: { backgroundColor: '#fff' },
  langText: { color: '#fff', fontSize: 13 },
  langTextActive: { color: colors.primaryDark },
  card: { marginTop: spacing.md },
  section: { marginBottom: spacing.sm, color: colors.text },
  hint: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 12 },
  linkBtn: { alignSelf: 'center', marginTop: spacing.sm, paddingVertical: 4 },
  linkText: { fontSize: 13, color: colors.primaryDark },
  bottomRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  smallCard: { flex: 1, padding: spacing.md },
});
