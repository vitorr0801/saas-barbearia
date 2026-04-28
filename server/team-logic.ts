/**
 * Lógica de equipe executada apenas no Node.
 * Padrão Arquitetural: Sincronização de Identidade, Redirecionamento Inteligente e Escala Tier-1
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TeamEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  serviceRoleKey: string;
};

export function getTeamEnvFromProcess(): TeamEnv {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
  
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    throw new Error("Variáveis do Supabase incompletas no .env");
  }
  return { supabaseUrl, supabaseAnonKey, serviceRoleKey };
}

function userClient(url: string, anonKey: string, accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

function adminClient(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function verifyOwnerFromAccessToken(
  env: TeamEnv,
  accessToken: string,
): Promise<
  | { ok: true; userId: string; barbeariaId: string }
  | { ok: false; message: string }
> {
  const anon = createClient(env.supabaseUrl, env.supabaseAnonKey);
  const { data: { user }, error: authErr } = await anon.auth.getUser(accessToken);
  if (authErr || !user) return { ok: false, message: "Sessão inválida ou expirada." };

  const scoped = userClient(env.supabaseUrl, env.supabaseAnonKey, accessToken);
  const { data: profile, error: profErr } = await scoped
    .from("profiles")
    .select("is_admin, barbearia_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) return { ok: false, message: "Não foi possível validar seu perfil." };
  if (profile?.role !== "barbeiro" || !profile?.is_admin || !profile?.barbearia_id) {
    return { ok: false, message: "Apenas o dono da barbearia pode gerenciar a equipe." };
  }

  return { ok: true, userId: user.id, barbeariaId: profile.barbearia_id as string };
}

// 🚀 AJUSTE TIER-1: Adicionamos o inviteId na assinatura da função
export async function inviteBarberForShop(
  env: TeamEnv,
  params: { email: string; barbeariaId: string; inviteLink: string; inviteId?: string; },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = params.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "E-mail inválido." };

  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, barbearia_id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile && existingProfile.barbearia_id === params.barbeariaId) {
    return { ok: false, message: "Este profissional já está na sua equipe." };
  }

  // 🛡️ LIMPEZA INTELIGENTE (Padrão Mundial)
  if (params.inviteId) {
    // 1. Deletamos convites antigos ou travados desse email, mas PROTEGEMOS o ID atual
    await admin.from("invites")
      .delete()
      .eq("email", email)
      .eq("barbearia_id", params.barbeariaId)
      .neq("id", params.inviteId);

    // 2. Atualizamos o convite (que o frontend inseriu) para garantir a role e status
    const { error: updErr } = await admin.from("invites")
      .update({ role: "barbeiro", status: "pendente" })
      .eq("id", params.inviteId);

    if (updErr) console.warn("[Team Logic] Falha ao sincronizar role do convite:", updErr);
  } else {
    // Fallback: Se por algum motivo não veio ID do frontend, apagamos tudo e geramos novo
    await admin.from("invites").delete().eq("email", email).eq("barbearia_id", params.barbeariaId);
    const { error: dbError } = await admin.from("invites").insert({
      email: email, barbearia_id: params.barbeariaId, role: "barbeiro", status: "pendente"
    });
    if (dbError) return { ok: false, message: "Erro ao registrar convite no banco." };
  }

  if (existingProfile) {
    const anon = createClient(env.supabaseUrl, env.supabaseAnonKey);
    const { error: magicErr } = await anon.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: params.inviteLink } 
    });
    
    if (magicErr) return { ok: false, message: "Falha ao enviar e-mail de reconvite." };
  } else {
    const { error: sbInviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: params.inviteLink, data: { role: "barbeiro" },
    });
    
    if (sbInviteErr) return { ok: false, message: sbInviteErr.message };
  }

  return { ok: true };
}

export async function removeBarberFromShop(
  env: TeamEnv,
  params: { barberId: string; ownerBarbeariaId: string; ownerUserId: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (params.barberId === params.ownerUserId) return { ok: false, message: "Você não pode remover a si mesmo." };

  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);

  const { data: deletedInvite } = await admin
    .from("invites")
    .delete()
    .eq("id", params.barberId)
    .eq("barbearia_id", params.ownerBarbeariaId)
    .select();

  if (deletedInvite && deletedInvite.length > 0) return { ok: true };

  const { data: target, error: fetchErr } = await admin
    .from("profiles")
    .select("id, barbearia_id, is_admin")
    .eq("id", params.barberId)
    .maybeSingle();

  if (fetchErr || !target) return { ok: false, message: "Profissional ou convite não encontrado." };
  if (target.barbearia_id !== params.ownerBarbeariaId) return { ok: false, message: "Este profissional não pertence à sua barbearia." };
  if (target.is_admin) return { ok: false, message: "Não é possível remover outro administrador." };

  const { error: updErr } = await admin
    .from("profiles")
    .update({ barbearia_id: null })
    .eq("id", params.barberId);

  if (updErr) return { ok: false, message: updErr.message || "Falha ao remover da equipe." };

  return { ok: true };
}

export type TeamMemberRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_admin: boolean | null;
  status: string | null;
};

export async function listTeamMembersForShop(
  env: TeamEnv,
  params: { barbeariaId: string },
): Promise<{ ok: true; members: TeamMemberRow[] } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);

  const [profilesResult, invitesResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, name, email, phone, is_admin, status")
      .eq("barbearia_id", params.barbeariaId)
      .limit(100),
    admin
      .from("invites")
      .select("id, email, status")
      .eq("barbearia_id", params.barbeariaId)
      .eq("status", "pendente")
      .limit(100) 
  ]);

  if (profilesResult.error) return { ok: false, message: "Erro ao listar equipe ativa." };

  const members: TeamMemberRow[] = (profilesResult.data ?? []).map(p => ({ ...p }));
  const activeEmails = new Set(members.map(m => m.email));

  if (invitesResult.data && invitesResult.data.length > 0) {
    const invitedEmails = invitesResult.data.map(i => i.email);

    // 🚀 OTIMIZAÇÃO TIER-1: Busca nomes reais para os convidados que já possuem conta
    const { data: existingProfiles } = await admin
      .from("profiles")
      .select("email, name")
      .in("email", invitedEmails);

    const nameMap = new Map(existingProfiles?.map(p => [p.email, p.name]));

    for (const inv of invitesResult.data) {
      if (!activeEmails.has(inv.email)) {
        
        // Prioriza o nome do banco, se não existir, formata o e-mail
        let displayName = nameMap.get(inv.email);
        
        if (!displayName) {
          const emailPrefix = (inv.email || "").split('@')[0];
          displayName = emailPrefix
            .split(/[._-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }

        members.push({
          id: inv.id, 
          name: displayName, 
          email: inv.email,
          phone: null,
          is_admin: false,
          status: "pendente", 
        });
      }
    }
  }

  members.sort((a, b) => {
    if (a.is_admin && !b.is_admin) return -1;
    if (!a.is_admin && b.is_admin) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return { ok: true, members };
}