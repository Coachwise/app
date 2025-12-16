import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import * as AuthAPI from '../api/auth';
import * as UsersAPI from '../api/users';
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
  };

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
    setTokens(result);
    await refreshUser();
  };

  const logout = async () => {
    if (tokens?.access_token) {
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
