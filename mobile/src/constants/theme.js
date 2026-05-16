export const colors = {
  primary: '#e67600',
  primaryDark: '#d86500',
  primaryLight: '#f08a00',
  gradientStart: '#E67600',
  gradientEnd: '#F08A00',
  background: '#FFF9F5',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textMuted: '#5c5c5c',
  border: '#f0e6de',
  success: '#16a34a',
  whatsapp: '#25D366',
  shadow: 'rgba(26, 26, 26, 0.08)',
  overlay: 'rgba(0,0,0,0.35)',
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export function fontForLocale(locale) {
  if (locale === 'en') {
    return {
      regular: 'BeVietnamPro_400Regular',
      medium: 'BeVietnamPro_600SemiBold',
      bold: 'BeVietnamPro_700Bold',
    };
  }
  return {
    regular: 'NotoSansDevanagari_400Regular',
    medium: 'NotoSansDevanagari_600SemiBold',
    bold: 'NotoSansDevanagari_700Bold',
  };
}
