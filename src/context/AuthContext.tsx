"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "cliente" | "barbeiro";

export interface AuthUser { 
  id: string; 
  name: string; 
  phone: string; 
  cpf: string;
  email: string; 
  role: Role;
  barbearia_id: string | null;
  is_admin: boolean;
}

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
  
  // 🛡️ Lock para evitar múltiplas inicializações em desenvolvimento (Strict Mode)
  const isInitializing = useRef(false);

  /**
   * 📡 SINCRONIZAÇÃO DE PERFIL
   * Otimizado para ser atômico e evitar "flashes" de estado vazio.
   */
  const fetchUserProfile = useCallback(async (userId: string, authEmail: string, metadata?: any) => {
    // Se não temos ID, liberamos o loading como visitante
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, cpf, role, email, barbearia_id, is_admin')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      const userData: AuthUser = {
        id: userId,
        name: data?.name || metadata?.name || "Mestre do Corte",
        phone: data?.phone || metadata?.phone || "",
        cpf: data?.cpf || "",
        email: data?.email || authEmail,
        role: (data?.role || metadata?.role || "cliente") as Role,
        barbearia_id: data?.barbearia_id ?? null,
        is_admin: Boolean(data?.is_admin),
      };

      setCurrentUser(userData);
      console.log(`✅ [BarberPro] Perfil ${userData.role} sincronizado.`);
    } catch (err) {
      console.error("❌ [BarberPro] Erro de sync. Aplicando modo de segurança.");
      // Fallback imediato para não travar o usuário
      setCurrentUser({
        id: userId,
        name: metadata?.name || "Usuário",
        phone: metadata?.phone || "",
        cpf: "",
        email: authEmail,
        role: (metadata?.role as Role) || "cliente",
        barbearia_id: null,
        is_admin: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🚀 ORQUESTRAÇÃO DE AUTENTICAÇÃO
   * Unificamos a lógica para evitar Race Conditions (corridas de dados).
   */
  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    // Timer de resiliência: Garante que a UI nunca trave por falha de rede
    const watchdog = setTimeout(() => setIsLoading(false), 5000);

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchUserProfile(
            session.user.id, 
            session.user.email!, 
            session.user.user_metadata
          );
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    };

    initialize();

    // 🔄 Listener Global de Auth: O coração da reatividade
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 [Auth Event]: ${event}`);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
      // Hard reset para garantir que nenhum cache de memória vaze
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
    } else {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  // 💎 Context Value Memoized: Performance Máxima
  const contextValue = useMemo(() => ({
    currentUser,
    role: currentUser?.role ?? null,
    isAuthenticated: !!currentUser,
    isLoading,
    logout,
    refreshUser
  }), [currentUser, isLoading, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}