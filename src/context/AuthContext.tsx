// src/context/AuthContext.tsx
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
  // RBAC
  job_title?: string | null;
  provides_services?: boolean | null;
  // ✅ NOVO: avatar exposto para todo o app
  avatar_url?: string | null;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // alias para compatibilidade
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (user: User) => {
    setIsLoading(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        let finalBarbeariaId = profileData.barbearia_id;
        let isAdmin = Boolean(profileData.is_admin);

        if (profileData.role === "barbeiro" && !finalBarbeariaId) {
          const { data: teamData } = await supabase
            .from("equipe")
            .select("barbearia_id")
            .eq("usuario_id", user.id)
            .maybeSingle();

          if (teamData) {
            finalBarbeariaId = teamData.barbearia_id;
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
          job_title: profileData.job_title || "Barbeiro",
          provides_services: profileData.provides_services ?? true,
          // ✅ Prioriza a tabela profiles como fonte de verdade
          // Fallback para metadados da sessão Auth (atualizado no upload)
          avatar_url: profileData.avatar_url || user.user_metadata?.avatar_url || null,
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (session?.user) fetchUserProfile(session.user);
      } else if (event === "SIGNED_OUT") {
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) await fetchUserProfile(session.user);
  }, [fetchUserProfile]);

  const value = useMemo(
    () => ({
      currentUser,
      role: currentUser?.role ?? null,
      isAuthenticated: !!currentUser,
      isLoading,
      logout,
      signOut: logout, // alias para compatibilidade com BarberProfile.tsx
      refreshUser,
    }),
    [currentUser, isLoading, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}