import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import * as AuthAPI from '../api/auth';
import * as UsersAPI from '../api/users';
import { setTokenRefreshHandler } from '../api/client';
import { unregisterPush } from '../lib/push';
import type { AuthTokens, LoginPayload, User } from '../api/types';

type AuthContextType = {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (body: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (tokens: AuthTokens | null) => void;
  refreshUser: () => Promise<void>;
};

const STORAGE_KEY = 'coachwise-auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens: AuthTokens | null) {
  if (!tokens) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokensState] = useState<AuthTokens | null>(() => readStoredTokens());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(tokens?.access_token);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!tokens?.access_token) {
        setUser(null);
        return;
      }
      setLoading(true);
      try {
        const me = await UsersAPI.getMe(tokens.access_token);
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          setTokensState(null);
          writeStoredTokens(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  const setTokens = (next: AuthTokens | null) => {
    setTokensState(next);
    writeStoredTokens(next);
    tokensRef.current = next;
  };

  // Keep a ref of the latest tokens so the refresh handler (registered once)
  // always reads the current refresh token, not a stale closure.
  const tokensRef = useRef<AuthTokens | null>(tokens);
  const refreshingRef = useRef<Promise<string | null> | null>(null);
  // Circuit breaker: count refreshes within a short window. If a refreshed token
  // keeps yielding 401s the refresh "succeeds" but never fixes anything, which
  // would otherwise spin getMe → refresh → getMe forever and spam the API.
  const refreshWindowRef = useRef<{ count: number; since: number }>({ count: 0, since: 0 });

  // Clear all auth state and drop to the Auth page (no API call, unlike logout()).
  const forceLogout = () => {
    setTokens(null);
    setUser(null);
  };

  // Register a single token-refresh handler the API client calls on a 401: swap
  // the expired access token for a fresh one, dedupe concurrent refreshes, and
  // log out if the refresh token is dead or refreshing is stuck in a loop.
  useEffect(() => {
    setTokenRefreshHandler(() => {
      if (refreshingRef.current) return refreshingRef.current;
      const rt = tokensRef.current?.refresh_token;
      if (!rt) return Promise.resolve(null);

      // Too many refreshes too fast means the fresh token isn't clearing the
      // 401s — the session is unrecoverable. Bail to the login screen instead of
      // hammering the API in an endless refresh loop.
      const now = Date.now();
      const w = refreshWindowRef.current;
      if (now - w.since > 10000) {
        w.count = 0;
        w.since = now;
      }
      w.count += 1;
      if (w.count > 3) {
        forceLogout();
        return Promise.resolve(null);
      }

      refreshingRef.current = (async () => {
        try {
          const next = await AuthAPI.refresh(rt);
          setTokens(next);
          return next.access_token;
        } catch {
          forceLogout();
          return null;
        } finally {
          refreshingRef.current = null;
        }
      })();
      return refreshingRef.current;
    });
    return () => setTokenRefreshHandler(null);
  }, []);

  const refreshUser = async () => {
    if (!tokens?.access_token) {
      setUser(null);
      return;
    }
    const me = await UsersAPI.getMe(tokens.access_token);
    setUser(me);
  };

  const login = async (body: LoginPayload) => {
    const result = await AuthAPI.login(body);
    // Fresh human-initiated session — clear any stale refresh-loop count so the
    // circuit breaker starts clean.
    refreshWindowRef.current = { count: 0, since: 0 };
    setTokens(result);
    await refreshUser();
  };

  const logout = async () => {
    if (tokens?.access_token) {
      // Drop the push token first — after the access token is blacklisted the
      // device would keep getting this account's notifications.
      await unregisterPush(tokens.access_token);
      try {
        await AuthAPI.logout(tokens.access_token);
      } catch {
        // swallow network/auth errors on logout
      }
    }
    setTokens(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      tokens,
      isAuthenticated,
      loading,
      login,
      logout,
      setTokens,
      refreshUser,
    }),
    [user, tokens, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
