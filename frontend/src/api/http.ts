import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { Session } from '@/types';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

// The access token lives in memory only (never localStorage).
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

type SessionListener = (session: Session | null) => void;
let listener: SessionListener = () => {};
export const onSessionChange = (fn: SessionListener) => {
  listener = fn;
};

export const http = axios.create({ baseURL, withCredentials: true });

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<Session | null> | null = null;

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<Session | null> {
  refreshing ??= axios
    .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      const session = res.data.data as Session;
      accessToken = session.accessToken;
      listener(session);
      return session;
    })
    .catch(() => {
      accessToken = null;
      listener(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// On 401: refresh once, then retry the original request.
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = /\/auth\/(login|register|refresh)/.test(original?.url ?? '');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const session = await refreshSession();
      if (session) {
        original.headers.Authorization = `Bearer ${session.accessToken}`;
        return http(original);
      }
    }
    return Promise.reject(error);
  },
);
