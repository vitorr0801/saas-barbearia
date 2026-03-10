import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Role = "cliente" | "barbeiro";

export interface AuthUser {
  name: string;
  phone: string;
  role: Role;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = "barberpro_current_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed && parsed.role && (parsed.role === "cliente" || parsed.role === "barbeiro")) {
        setCurrentUser(parsed);
      }
    } catch {
      // Ignore malformed data
      window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, []);

  const login = (user: AuthUser) => {
    setCurrentUser(user);
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      currentUser,
      role: currentUser?.role ?? null,
      isAuthenticated: currentUser !== null,
      login,
      logout,
    }),
    [currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

