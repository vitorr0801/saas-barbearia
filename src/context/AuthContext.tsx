"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  const initialized = useRef(false);

  // 📡 BUSCA DE PERFIL COM FALLBACK DE METADADOS
  const fetchUserProfile = useCallback(async (userId: string, authEmail: string, metadata?: any) => {
    console.log("🔍 [Auth] Buscando perfil na tabela 'profiles'...");
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, role, email')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log("✅ [Auth] Perfil carregado da tabela.");
        setCurrentUser({
          id: data.id,
          name: data.name || "Usuário",
          phone: data.phone || "",
          email: data.email || authEmail,
          role: (data.role as Role) || "cliente",
        });
      } else {
        // 💎 ESTRATÉGIA DIAMOND: Se a tabela falhar, usamos os metadados do cadastro
        console.warn("⚠️ [Auth] Tabela profiles vazia. Usando metadados do Auth.");
        setCurrentUser({
          id: userId,
          name: metadata?.name || "Usuário",
          phone: metadata?.phone || "",
          email: authEmail,
          role: (metadata?.role as Role) || "cliente",
        });
      }
    } catch (err) {
      console.error("❌ [Auth] Erro na busca. Aplicando fallback de segurança.");
      // Se der erro no banco (como o RLS travado), libera o usuário com o que temos
      setCurrentUser({
        id: userId,
        name: metadata?.name || "Usuário",
        phone: metadata?.phone || "",
        email: authEmail,
        role: (metadata?.role as Role) || "cliente",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const safetyTimer = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) console.error("🚨 [Auth] TIMEOUT! Destravando interface na marra.");
        return false;
      });
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const value = useMemo(() => ({
    currentUser,
    role: currentUser?.role ?? null,
    isAuthenticated: !!currentUser,
    isLoading,
    logout: async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
      window.location.href = "/";
    },
    refreshUser: async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
      } else {
        setIsLoading(false);
      }
    }
  }), [currentUser, isLoading, fetchUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}