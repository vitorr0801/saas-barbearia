"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

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

  // 🚀 NOVAS PROPRIEDADES DO RBAC (Padrão Strict Supabase)
  job_title?: string | null;
  provides_services?: boolean | null;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (user: User) => {
    setIsLoading(true);

    try {
      /**
       * 🚀 TIER-1: BUSCA HÍBRIDA MULTI-TENANT
       * Buscamos o perfil básico E verificamos se ele existe na tabela de convites/profissionais.
       * Isso garante que barbeiros convidados carreguem o barbearia_id IMEDIATAMENTE.
       */
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        let finalBarbeariaId = profileData.barbearia_id;
        let isAdmin = Boolean(profileData.is_admin);

        /**
         * 🕵️ PENTE FINO: Se ele é barbeiro mas não tem barbearia_id no perfil,
         * verificamos se ele foi vinculado via convite em outra tabela (ex: profissionais ou equipe).
         * Ajuste o nome da tabela abaixo ('equipe') conforme sua estrutura.
         */
        if (profileData.role === 'barbeiro' && !finalBarbeariaId) {
          const { data: teamData } = await supabase
            .from('equipe') // ou 'profissionais'
            .select('barbearia_id')
            .eq('usuario_id', user.id)
            .maybeSingle();
          
          if (teamData) {
            finalBarbeariaId = teamData.barbearia_id;
            // Se ele é funcionário, ele geralmente não é o admin da barbearia
            isAdmin = false; 
          }
        }

        setCurrentUser({
          id: user.id,
          name: profileData.name || user.user_metadata?.full_name || "Membro",
          phone: profileData.phone || "",
          cpf: profileData.cpf || "",
          email: user.email || "",
          role: profileData.role as Role,
          barbearia_id: finalBarbeariaId,
          is_admin: isAdmin,
          // 🚀 Lendo e populando os dados do banco para o App inteiro usar!
          job_title: profileData.job_title || "Barbeiro",
          provides_services: profileData.provides_services ?? true,
        });
      }
    } catch (err) {
      console.error("[AuthContext] Erro crítico na sincronização:", err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log(`[Auth Event]: ${event}`);

      // 🛡️ SECURITY: Gerenciamento rigoroso de estados de sessão
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          fetchUserProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 6000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    window.location.replace("/");
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await fetchUserProfile(session.user);
  }, [fetchUserProfile]);

  const value = useMemo(() => ({ 
    currentUser, 
    role: currentUser?.role ?? null, 
    isAuthenticated: !!currentUser, 
    isLoading, 
    logout, 
    refreshUser 
  }), [currentUser, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}