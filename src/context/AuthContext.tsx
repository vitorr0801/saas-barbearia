"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "cliente" | "barbeiro";
export interface AuthUser { id: string; name: string; phone: string; email: string; role: Role; }

interface AuthContextValue {
  currentUser: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, authEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, role, email')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.name || "Usuário",
          phone: data.phone || "",
          email: data.email || authEmail,
          role: (data.role as Role) || "cliente",
        });
      } else {
        // Resiliência de Identidade
        setCurrentUser({ id: userId, name: "Usuário", phone: "", email: authEmail, role: "cliente" });
      }
    } catch (err) {
      console.error("❌ [Auth_Error]:", err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 🛡️ TENTATIVA INICIAL IMEDIATA
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // 🔔 OUVINTE DE ESTADO (Sem travas de Ref)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH_EVENT]: ${event}`);
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const value = useMemo(() => ({
    currentUser,
    role: currentUser?.role ?? null,
    isAuthenticated: !!currentUser,
    isLoading, // Agora o isLoading é puramente controlado pelas funções
    logout: async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
    },
    refreshUser: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchUserProfile(session.user.id, session.user.email!);
    }
  }), [currentUser, isLoading, fetchUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}