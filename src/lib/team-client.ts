/**
 * Cliente API da Equipe (Frontend)
 * Padrão Arquitetural: Fetch Wrapper Centralizado, Safe Parsing e DRY (Tier-1)
 */
import { supabase } from "@/lib/supabase";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_admin: boolean | null;
  status: string | null;
};

// ⚙️ MOTOR CENTRAL DE REQUISIÇÕES (DRY)
async function fetchTeamApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return { error: "Sessão expirada. Faça login novamente." };
    }

    const res = await fetch(`/api/team${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...options?.headers,
      },
    });

    // 🚀 SAFE PARSING (Resiliência de Payload)
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};

    if (!res.ok) {
      return { error: json.error || `Erro no servidor (${res.status})` };
    }

    return { data: json as T };
  } catch (err) {
    console.error(`[Team API Client Error - ${endpoint}]:`, err);
    return { error: "Falha na conexão. Verifique sua internet." };
  }
}

// ==========================================
// MÉTODOS PÚBLICOS DA API (Limpos e Diretos)
// ==========================================

/**
 * 📧 INVITE BARBER (Fluxo de Segurança Tier-1)
 * Implementa a estratégia de ID Determinístico para evitar divergências.
 */
export async function inviteBarberByEmail(email: string): Promise<{ error?: string }> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Identifica o Dono e a Empresa
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { error: "Usuário não autenticado." };

    const { data: profile } = await supabase
      .from('profiles')
      .select('barbearia_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.barbearia_id) {
      return { error: "Apenas donos de barbearia podem convidar membros." };
    }

    // 🚀 TIER-1: GERAÇÃO DETERMINÍSTICA DO TOKEN (Client-Side)
    // Nós criamos o UUID aqui. Isso garante que não haverá divergência 
    // entre o que vai para o banco e o que vai para o e-mail.
    const inviteId = crypto.randomUUID();

    // 2. 🔐 INSERÇÃO NO BANCO (Force ID)
    const { error: inviteError } = await supabase
      .from('invites')
      .insert({
        id: inviteId, // Forçamos o banco a usar o NOSSO ID
        email: cleanEmail,
        barbearia_id: profile.barbearia_id,
        status: 'pendente'
      });

    // 🎯 Validação extra: Se o e-mail já tem convite pendente, o banco pode dar erro
    if (inviteError) {
       console.error("Erro ao inserir convite:", inviteError);
       return { error: "Não foi possível criar o convite. Ele já existe?" };
    }

    // 3. 🔗 MONTAGEM DO LINK SEGURO
    const inviteLink = `${origin}/convite-aceito?token=${inviteId}`;

    // 4. DISPARO DO E-MAIL (Passando a responsabilidade para a API)
    const { error: apiError } = await fetchTeamApi("/invite", {
      method: "POST",
      body: JSON.stringify({ 
        email: cleanEmail, 
        invite_link: inviteLink,
        invite_id: inviteId // Mandamos o ID separado por garantia
      }),
    });

    return { error: apiError };

  } catch (err: any) {
    console.error("[Invite Flow Error]:", err);
    return { error: err.message || "Falha ao processar convite." };
  }
}

// ... métodos removeBarberById e listTeamMembers continuam iguais
export async function removeBarberById(barberId: string): Promise<{ error?: string }> {
  const { error } = await fetchTeamApi("/remove", {
    method: "POST",
    body: JSON.stringify({ barber_id: barberId }),
  });
  return { error };
}

export async function listTeamMembers(): Promise<{ members: TeamMember[]; error?: string }> {
  const { data, error } = await fetchTeamApi<{ members: TeamMember[] }>("/list", {
    method: "GET",
  });
  if (error) return { members: [], error };
  return { members: data?.members ?? [] };
}