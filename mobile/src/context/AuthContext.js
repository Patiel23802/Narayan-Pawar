import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const loadMe = useCallback(async (activeToken) => {
    const res = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredToken();
        if (stored) {
          setToken(stored);
          await loadMe(stored);
        }
      } catch {
        await setStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, [loadMe]);

  const applySession = useCallback(async (newToken, nextUser) => {
    await setStoredToken(newToken);
    setToken(newToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const checkMobile = useCallback(async (mobile) => {
    const res = await api.post('/api/auth/check-mobile', { mobile });
    return {
      exists: Boolean(res.data?.exists),
      hasPassword: Boolean(res.data?.has_password),
    };
  }, []);

  const sendOtp = useCallback(async (mobile) => {
    const res = await api.post('/api/auth/send-otp', { mobile });
    return res.data;
  }, []);

  const verifyOtp = useCallback(
    async (mobile, otp) => {
      const res = await api.post('/api/auth/verify-otp', { mobile, otp: String(otp).trim() });
      await applySession(res.data.token, res.data.user);
      return res.data.user;
    },
    [applySession]
  );

  /** After Firebase verifies the SMS OTP, exchange Firebase idToken for Civic Pulse JWT. */
  const loginWithFirebasePhone = useCallback(
    async (idToken) => {
      const res = await api.post('/api/auth/firebase-phone', { idToken });
      await applySession(res.data.token, res.data.user);
      return res.data.user;
    },
    [applySession]
  );

  const loginPassword = useCallback(
    async (mobile, password) => {
      const res = await api.post('/api/auth/login', { mobile, password });
      await applySession(res.data.token, res.data.user);
      return res.data.user;
    },
    [applySession]
  );

  const setPassword = useCallback(
    async (password) => {
      const res = await api.post('/api/auth/set-password', { password });
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const refreshMe = useCallback(async () => {
    if (!token) return null;
    return loadMe(token);
  }, [token, loadMe]);

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      checkMobile,
      sendOtp,
      verifyOtp,
      loginWithFirebasePhone,
      loginPassword,
      setPassword,
      logout,
      refreshMe,
      applySession,
    }),
    [
      token,
      user,
      booting,
      checkMobile,
      sendOtp,
      verifyOtp,
      loginWithFirebasePhone,
      loginPassword,
      setPassword,
      logout,
      refreshMe,
      applySession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
