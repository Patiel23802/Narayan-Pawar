import axios from 'axios';
import Constants from 'expo-constants';
import { getExpoGoProjectConfig, isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'civic_pulse_token';

const DEFAULT_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '4000';

function portFromConfiguredLoopback(configured) {
  if (!configured) return DEFAULT_API_PORT;
  try {
    const u = new URL(configured.startsWith('http') ? configured : `http://${configured}`);
    return u.port || DEFAULT_API_PORT;
  } catch {
    return DEFAULT_API_PORT;
  }
}

function stripTrailingSlash(url) {
  return url ? url.replace(/\/$/, '') : url;
}

function isLoopbackUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return /127\.0\.0\.1|localhost/i.test(url);
  }
}

/**
 * Host where the Metro bundler runs (your Mac/PC). Use this for the API in dev
 * when app.json points at 127.0.0.1 — on a real phone, localhost is the phone itself.
 */
function devMachineHost() {
  if (isRunningInExpoGo()) {
    const dbg = getExpoGoProjectConfig()?.debuggerHost;
    if (dbg) {
      const host = dbg.split(':')[0];
      if (host) return host;
    }
  }
  const dbg =
    Constants.manifest2?.extra?.expoGo?.debuggerHost ?? Constants.manifest?.debuggerHost;
  if (dbg) {
    const host = String(dbg).split(':')[0];
    if (host) return host;
  }
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return '127.0.0.1';
}

function resolveBaseURL() {
  const fromEnv = stripTrailingSlash(process.env.EXPO_PUBLIC_API_URL);
  if (fromEnv) return fromEnv;

  const configured = stripTrailingSlash(Constants.expoConfig?.extra?.apiUrl);

  if (!__DEV__) {
    return configured || `http://127.0.0.1:${DEFAULT_API_PORT}`;
  }

  if (configured && !isLoopbackUrl(configured)) {
    return configured;
  }

  const host = devMachineHost();
  const port = portFromConfiguredLoopback(configured);
  return `http://${host}:${port}`;
}

const baseURL = resolveBaseURL();

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const message = err?.response?.data?.error || '';
    if (status === 401 && /invalid|expired|missing/i.test(message)) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    return Promise.reject(err);
  }
);

export async function setStoredToken(token) {
  if (token) await AsyncStorage.setItem(STORAGE_KEY, token);
  else await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function getStoredToken() {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export function getBaseUrl() {
  return baseURL;
}

/**
 * Multipart uploads in React Native + axios often fail with "Network Error" unless
 * FormData is passed through without axios setting Content-Type (boundary is required).
 */
export function postFormData(url, formData, config = {}) {
  return api.post(url, formData, {
    ...config,
    timeout: config.timeout ?? 60000,
    transformRequest: (data, headers) => {
      if (typeof FormData !== 'undefined' && data instanceof FormData) {
        delete headers['Content-Type'];
      }
      return data;
    },
  });
}

if (__DEV__) {
  console.log('[api] baseURL =', baseURL);
}
