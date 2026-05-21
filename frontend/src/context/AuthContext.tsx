"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  isManager: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "mini-jira-token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (storedToken: string) => {
    const profile = await api.getMe(storedToken);
    setToken(storedToken);
    setUser(profile);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    loadUser(stored)
      .catch(() => sessionStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, [loadUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const newToken = await api.login(username, password);
      sessionStorage.setItem(TOKEN_KEY, newToken);
      const profile = await api.getMe(newToken);
      setToken(newToken);
      setUser(profile);
      router.push(profile.role === "manager" ? "/dashboard" : "/board");
    },
    [router]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isManager: user?.role === "manager",
      login,
      logout,
    }),
    [token, user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
