import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "cliente" | "profissional" | null;

interface AuthContextValue {
  role: Role;
  isAuthenticated: boolean;
  login: (role: Exclude<Role, null>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "barberpro_auth_role";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored === "cliente" || stored === "profissional") {
      setRole(stored);
    }
  }, []);

  const login = (newRole: Exclude<Role, null>) => {
    setRole(newRole);
    window.localStorage.setItem(STORAGE_KEY, newRole);
  };

  const logout = () => {
    setRole(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      role,
      isAuthenticated: role !== null,
      login,
      logout,
    }),
    [role],
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

