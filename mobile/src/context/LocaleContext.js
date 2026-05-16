 import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../i18n';
import { fontForLocale } from '../constants/theme';

const LocaleContext = createContext(null);
const LOCALE_KEY = 'civic_pulse_locale';

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('mr');

  React.useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LOCALE_KEY);
      if (saved === 'mr' || saved === 'hi' || saved === 'en') {
        setLocaleState(saved);
      }
    })();
  }, []);

  const setLocale = useCallback(async (next) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_KEY, next);
  }, []);

  const t = useCallback((key) => translate(locale, key), [locale]);

  const fonts = useMemo(() => fontForLocale(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, fonts }),
    [locale, setLocale, t, fonts]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
