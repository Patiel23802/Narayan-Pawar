import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Construction, Landmark, Megaphone, PhoneCall, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import {
  confirmFirebasePhoneOtp,
  isFirebasePhoneAuthAvailable,
  sendFirebasePhoneOtp,
} from '../services/firebasePhoneAuth';
import { getApiErrorMessage } from '../utils/apiErrors';
import { routeAfterAuth } from '../utils/authNavigation';

const ILLUSTRATION_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBklVvpRyIr-nHz8RQzcBCKX11YZ_N4__E98214Uw1SoCL2X9QT6ztnBdNOrBXUVkLsfxk6ZGD3Z3NnL1pUhbZLpghYxY7PVYNVkHigFyHvEcAva11NWfFdCx-3HoW8SXXAwwLO93oSmk8RQ5ct70PvPesPNz0ygPYyCAvMeYynr16yx24XA_wDujGwO4qdDr3EI_VgdWLPoUP2DFaZqJzYN_hcuA33hOS5Ux8oKEeSzXAhHyPzD15uxJRp2a0X37cHVYgLAPD_VwEy';

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

const EMPTY_OTP = ['', '', '', '', '', ''];

export function SignUpScreen() {
  const router = useRouter();
  const { locale, setLocale, t, fonts } = useLocale();
  const { checkMobile, sendOtp, verifyOtp, loginWithFirebasePhone, loginPassword } = useAuth();

  const useFirebaseSms = useMemo(() => isFirebasePhoneAuthAvailable(), []);

  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(EMPTY_OTP);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('otp');
  const [checking, setChecking] = useState(false);
  const [hasPasswordOnServer, setHasPasswordOnServer] = useState(false);

  const lastCheckedRef = useRef('');
  const verifyInFlightRef = useRef(false);
  const firebaseConfirmationRef = useRef(null);
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()));

  const mobile10 = useMemo(() => onlyDigits(mobile).slice(0, 10), [mobile]);
  const otp = useMemo(() => otpDigits.join(''), [otpDigits]);

  useEffect(() => {
    (async () => {
      const m = mobile10;
      if (m.length !== 10) {
        setMode('otp');
        setHasPasswordOnServer(false);
        setOtpSent(false);
        setOtpDigits(EMPTY_OTP);
        setPassword('');
        lastCheckedRef.current = '';
        return;
      }
      if (lastCheckedRef.current === m) return;
      lastCheckedRef.current = m;
      setChecking(true);
      try {
        const { hasPassword } = await checkMobile(m);
        setHasPasswordOnServer(hasPassword);
        setMode(hasPassword ? 'password' : 'otp');
        setOtpSent(false);
        setOtpDigits(EMPTY_OTP);
        setPassword('');
      } catch {
        setHasPasswordOnServer(false);
        setMode('otp');
      } finally {
        setChecking(false);
      }
    })();
  }, [mobile10, checkMobile]);

  const switchToOtp = useCallback(() => {
    firebaseConfirmationRef.current = null;
    setMode('otp');
    setOtpSent(false);
    setOtpDigits(EMPTY_OTP);
    setPassword('');
  }, []);

  const switchToPassword = useCallback(() => {
    if (!hasPasswordOnServer) return;
    setMode('password');
    setOtpSent(false);
    setOtpDigits(EMPTY_OTP);
  }, [hasPasswordOnServer]);

  const onSendOtp = async () => {
    if (mobile10.length !== 10) {
      Alert.alert(t('error'), t('enterValidMobile'));
      return;
    }
    setLoading(true);
    try {
      if (useFirebaseSms) {
        firebaseConfirmationRef.current = await sendFirebasePhoneOtp(mobile10);
      } else {
        await sendOtp(mobile10);
      }
      setOtpSent(true);
      setOtpDigits(EMPTY_OTP);
      requestAnimationFrame(() => otpRefs.current?.[0]?.current?.focus?.());
    } catch (e) {
      Alert.alert(t('error'), getApiErrorMessage(e, t('otpSendFailed')));
    } finally {
      setLoading(false);
    }
  };

  const onPasswordLogin = async () => {
    if (mobile10.length !== 10) {
      Alert.alert(t('error'), t('enterValidMobile'));
      return;
    }
    if (!password.trim()) {
      Alert.alert(t('error'), t('enterPassword'));
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

  const onVerify = useCallback(async () => {
    if (mobile10.length !== 10 || otp.length !== 6 || verifyInFlightRef.current) return;
    verifyInFlightRef.current = true;
    setLoading(true);
    try {
      let u;
      if (useFirebaseSms) {
        if (!firebaseConfirmationRef.current) {
          throw new Error(
            'Firebase session expired. Tap Resend OTP and enter the code from Firebase test numbers (or SMS).'
          );
        }
        const { idToken } = await confirmFirebasePhoneOtp(firebaseConfirmationRef.current, otp);
        firebaseConfirmationRef.current = null;
        u = await loginWithFirebasePhone(idToken);
      } else {
        u = await verifyOtp(mobile10, otp);
      }
      routeAfterAuth(router, u);
    } catch (e) {
      Alert.alert(t('error'), getApiErrorMessage(e, t('otpInvalid')));
      setOtpDigits(EMPTY_OTP);
      requestAnimationFrame(() => otpRefs.current?.[0]?.current?.focus?.());
    } finally {
      setLoading(false);
      verifyInFlightRef.current = false;
    }
  }, [mobile10, otp, useFirebaseSms, verifyOtp, loginWithFirebasePhone, router, t]);

  useEffect(() => {
    if (mode === 'otp' && otpSent && otp.length === 6 && !loading) {
      onVerify();
    }
  }, [mode, otpSent, otp, loading, onVerify]);

  const onChangeOtp = (idx, next) => {
    const raw = onlyDigits(next);
    if (raw.length > 1) {
      const chars = raw.slice(0, 6).split('');
      setOtpDigits((prev) => {
        const copy = [...prev];
        chars.forEach((c, i) => {
          if (idx + i < 6) copy[idx + i] = c;
        });
        return copy;
      });
      const focusIdx = Math.min(idx + chars.length, 5);
      requestAnimationFrame(() => otpRefs.current?.[focusIdx]?.current?.focus?.());
      return;
    }
    const d = raw.slice(-1);
    setOtpDigits((prev) => {
      const copy = [...prev];
      copy[idx] = d;
      return copy;
    });
    if (d && idx < 5) {
      requestAnimationFrame(() => otpRefs.current?.[idx + 1]?.current?.focus?.());
    }
  };

  const onOtpKeyPress = (idx, e) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      requestAnimationFrame(() => otpRefs.current?.[idx - 1]?.current?.focus?.());
    }
  };

  const primaryDisabled =
    loading ||
    mobile10.length !== 10 ||
    (mode === 'password' && !password.trim()) ||
    (mode === 'otp' && otpSent);

  const onPrimaryPress = mode === 'password' ? onPasswordLogin : onSendOtp;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#E67600', '#D95E00', '#F2A45E']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.overlayGlow} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.langRow}>
            <LangChip label={t('marathi')} active={locale === 'mr'} onPress={() => setLocale('mr')} fonts={fonts} />
            <LangChip label={t('hindi')} active={locale === 'hi'} onPress={() => setLocale('hi')} fonts={fonts} />
            <LangChip label={t('english')} active={locale === 'en'} onPress={() => setLocale('en')} fonts={fonts} />
          </View>

          <View style={styles.brand}>
            <LinearGradient colors={['#FF6D00', '#FFAB40']} style={styles.brandIconWrap}>
              <Landmark size={34} color="#fff" />
            </LinearGradient>
            <Text style={[styles.brandTitle, { fontFamily: fonts.bold }]}>The Civic Pulse</Text>
            <Text style={[styles.brandSub, { fontFamily: fonts.medium }]}>{t('signupTagline')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.step}>
              <Text style={[styles.h2, { fontFamily: fonts.bold }]}>
                {mode === 'password' ? t('welcomeBack') : t('signupTitle')}
              </Text>
              <Text style={[styles.p, { fontFamily: fonts.regular }]}>
                {mode === 'password' ? t('enterPasswordPrompt') : t('signupSubtitle')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.phoneInput}>
                <View style={styles.phonePrefix}>
                  <PhoneCall size={18} color="#5a5c5c" />
                  <Text style={[styles.prefixText, { fontFamily: fonts.medium }]}>+91</Text>
                  <View style={styles.prefixDivider} />
                </View>
                <TextInput
                  value={mobile10}
                  onChangeText={(v) => setMobile(onlyDigits(v).slice(0, 10))}
                  placeholder={t('mobilePlaceholder')}
                  placeholderTextColor="#767777"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[styles.phoneField, { fontFamily: fonts.medium }]}
                />
              </View>

              {checking ? (
                <Text style={[styles.p, { fontFamily: fonts.regular }]}>{t('loading')}</Text>
              ) : null}

              {mode === 'password' ? (
                <View style={styles.passwordBlock}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('password')}
                    placeholderTextColor="#767777"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    style={[styles.passwordField, { fontFamily: fonts.medium }]}
                    onSubmitEditing={onPasswordLogin}
                    returnKeyType="go"
                  />
                  {__DEV__ ? (
                    <Text style={[styles.devHint, { fontFamily: fonts.regular }]}>{t('devLoginHint')}</Text>
                  ) : null}
                  <Pressable disabled={primaryDisabled} onPress={onPrimaryPress} style={primaryBtnStyle(primaryDisabled, loading)}>
                    <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>{t('login')}</Text>
                    <ArrowRight size={20} color="#fff" />
                  </Pressable>
                  <Pressable onPress={switchToOtp} disabled={loading} style={styles.linkBtn}>
                    <Text style={[styles.linkText, { fontFamily: fonts.bold }]}>{t('useOtpInstead')}</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {!otpSent ? (
                    <Pressable disabled={primaryDisabled} onPress={onPrimaryPress} style={primaryBtnStyle(primaryDisabled, loading)}>
                      <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>{t('sendOtp')}</Text>
                      <ArrowRight size={20} color="#fff" />
                    </Pressable>
                  ) : (
                    <Text style={[styles.otpSentNote, { fontFamily: fonts.medium }]}>{t('otpSentSuccess')}</Text>
                  )}

                  {hasPasswordOnServer ? (
                    <Pressable onPress={switchToPassword} disabled={loading} style={styles.linkBtn}>
                      <Text style={[styles.linkText, { fontFamily: fonts.bold }]}>{t('usePasswordInstead')}</Text>
                    </Pressable>
                  ) : null}

                  <View style={styles.dividerRow}>
                    <View style={styles.hr} />
                    <Text style={[styles.dividerText, { fontFamily: fonts.bold }]}>{t('verification')}</Text>
                    <View style={styles.hr} />
                  </View>

                  <View style={[styles.step, !otpSent ? styles.stepDisabled : null]}>
                    <Text style={[styles.h2, { fontFamily: fonts.bold }]}>{t('enterOtpTitle')}</Text>
                    <Text style={[styles.p, { fontFamily: fonts.regular }]}>{t('enterOtpSubtitle')}</Text>

                    <View style={styles.otpRow}>
                      {otpDigits.map((val, idx) => (
                        <TextInput
                          key={idx}
                          ref={otpRefs.current[idx]}
                          value={val}
                          onChangeText={(text) => onChangeOtp(idx, text)}
                          onKeyPress={(e) => onOtpKeyPress(idx, e)}
                          editable={otpSent && !loading}
                          maxLength={6}
                          keyboardType="number-pad"
                          textContentType="oneTimeCode"
                          style={[styles.otpBox, { fontFamily: fonts.bold }, !otpSent ? styles.otpBoxDisabled : null]}
                        />
                      ))}
                    </View>

                    {useFirebaseSms ? (
                      <Text style={[styles.devHint, { fontFamily: fonts.regular }]}>{t('firebaseSmsHint')}</Text>
                    ) : __DEV__ ? (
                      <Text style={[styles.devHint, { fontFamily: fonts.regular }]}>{t('devOtpHint')}</Text>
                    ) : null}

                    <View style={styles.resendRow}>
                      <Text style={[styles.resendHint, { fontFamily: fonts.medium }]}>{t('codeNotReceived')}</Text>
                      <Pressable disabled={!otpSent || loading} onPress={onSendOtp}>
                        <Text
                          style={[
                            styles.resendBtn,
                            { fontFamily: fonts.bold },
                            !otpSent || loading ? styles.resendBtnDisabled : null,
                          ]}
                        >
                          {t('resendOtp')}
                        </Text>
                      </Pressable>
                    </View>

                    <Pressable
                      disabled={!otpSent || otp.length !== 6 || loading}
                      onPress={onVerify}
                      style={[
                        styles.confirmBtn,
                        otpSent && otp.length === 6 && !loading ? styles.confirmBtnEnabled : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.confirmText,
                          { fontFamily: fonts.bold },
                          otpSent && otp.length === 6 && !loading ? styles.confirmTextEnabled : null,
                        ]}
                      >
                        {loading ? t('loading') : t('verify')}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.trustWrap}>
            <View style={styles.trustBadge}>
              <ShieldCheck size={18} color="#176a21" />
              <Text style={[styles.trustText, { fontFamily: fonts.medium }]}>{t('securityBadge')}</Text>
            </View>
            <View style={styles.trustGrid}>
              <InfoTile titleTop={t('tileProgressTop')} titleBottom={t('tileProgressBottom')} Icon={Construction} fonts={fonts} />
              <InfoTile titleTop={t('tileUpdatesTop')} titleBottom={t('tileUpdatesBottom')} Icon={Megaphone} fonts={fonts} />
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

function primaryBtnStyle(disabled, loading) {
  return ({ pressed }) => [
    styles.primaryBtn,
    disabled ? styles.primaryBtnDisabled : null,
    pressed && !disabled && !loading ? styles.pressed : null,
  ];
}

function LangChip({ label, active, onPress, fonts }) {
  return (
    <Pressable onPress={onPress} style={[styles.langChip, active ? styles.langChipActive : styles.langChipInactive]}>
      <Text style={[styles.langChipText, { fontFamily: fonts.bold }, active ? styles.langChipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function InfoTile({ titleTop, titleBottom, Icon, fonts }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIconBg}>
        <Icon size={20} color="#FF6D00" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.tileKicker, { fontFamily: fonts.bold }]}>{titleTop}</Text>
        <Text style={[styles.tileTitle, { fontFamily: fonts.bold }]}>{titleBottom}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FF8C00' },
  flex: { flex: 1 },
  overlayGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.0)' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: 48, paddingBottom: 48, alignItems: 'center' },
  langRow: { width: '100%', maxWidth: 420, flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 },
  langChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.xl },
  langChipActive: { backgroundColor: 'rgba(255,255,255,0.92)', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  langChipInactive: { backgroundColor: 'rgba(255,255,255,0.20)' },
  langChipText: { fontSize: 13, color: '#fff' },
  langChipTextActive: { color: '#E65100' },
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
  step: { gap: 6 },
  stepDisabled: { opacity: 0.6 },
  h2: { fontSize: 20, color: '#2d2f2f' },
  p: { fontSize: 13, color: '#5a5c5c' },
  inputGroup: { gap: 14, marginTop: 16 },
  phoneInput: { backgroundColor: '#f0f1f1', borderRadius: 16, height: 56, justifyContent: 'center' },
  phonePrefix: { position: 'absolute', left: 14, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefixText: { color: '#5a5c5c', fontSize: 14, paddingRight: 8 },
  prefixDivider: { width: 1, height: 22, backgroundColor: 'rgba(172,173,173,0.35)' },
  phoneField: { paddingLeft: 94, paddingRight: 14, fontSize: 15, color: '#2d2f2f', height: 56 },
  passwordBlock: { gap: 12 },
  passwordField: {
    backgroundColor: '#f0f1f1',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#2d2f2f',
  },
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
  },
  primaryBtnDisabled: { opacity: 0.55, shadowOpacity: 0 },
  pressed: { transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: '#fff', fontSize: 15 },
  linkBtn: { alignSelf: 'center', paddingVertical: 4 },
  linkText: { fontSize: 13, color: '#FF6D00' },
  devHint: { fontSize: 11, color: '#767777', lineHeight: 16 },
  otpSentNote: { fontSize: 13, color: colors.primaryDark, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  hr: { flex: 1, height: 1, backgroundColor: '#e7e8e8' },
  dividerText: { fontSize: 10, color: '#acadad', letterSpacing: 2, textTransform: 'uppercase' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#f0f1f1',
    textAlign: 'center',
    fontSize: 20,
    color: '#2d2f2f',
  },
  otpBoxDisabled: { backgroundColor: '#f0f1f1' },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  resendHint: { fontSize: 13, color: '#5a5c5c' },
  resendBtn: { fontSize: 13, color: '#FF6D00' },
  resendBtnDisabled: { color: '#acadad' },
  confirmBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbdddd',
    marginTop: 14,
  },
  confirmBtnEnabled: {
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  confirmText: { fontSize: 15, color: '#5a5c5c' },
  confirmTextEnabled: { color: '#fff' },
  trustWrap: { width: '100%', maxWidth: 420, alignItems: 'center', marginTop: 18, gap: 16 },
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
  trustGrid: { width: '100%', flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.90)',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  tileIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileKicker: { fontSize: 10, letterSpacing: 1.6, color: '#acadad', textTransform: 'uppercase' },
  tileTitle: { fontSize: 14, color: '#2d2f2f', marginTop: 2 },
  illustrationWrap: { marginTop: 34, opacity: 0.8 },
  illustration: { height: 64, width: 240 },
});
