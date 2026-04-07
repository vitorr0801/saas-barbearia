/**
 * Lógica de equipe executada apenas no Node (middleware Vite / scripts).
 * Não importar em `src/` do front.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TeamEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  serviceRoleKey: string;
};

export function getTeamEnvFromProcess(): TeamEnv {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "";
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios.");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY é obrigatório para convites.");
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
  const {
    data: { user },
    error: authErr,
  } = await anon.auth.getUser(accessToken);
  if (authErr || !user) {
    return { ok: false, message: "Sessão inválida ou expirada." };
  }

  const scoped = userClient(env.supabaseUrl, env.supabaseAnonKey, accessToken);
  const { data: profile, error: profErr } = await scoped
    .from("profiles")
    .select("is_admin, barbearia_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) {
    return { ok: false, message: "Não foi possível validar seu perfil." };
  }
  if (profile?.role !== "barbeiro" || !profile?.is_admin || !profile?.barbearia_id) {
    return { ok: false, message: "Apenas o dono da barbearia pode gerenciar a equipe." };
  }

  return {
    ok: true,
    userId: user.id,
    barbeariaId: profile.barbearia_id as string,
  };
}

export async function inviteBarberForShop(
  env: TeamEnv,
  params: {
    email: string;
    barbeariaId: string;
    redirectTo: string;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = params.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "E-mail inválido." };
  }

  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: params.redirectTo,
      data: { role: "barbeiro" },
    },
  );

  if (inviteErr) {
    return { ok: false, message: inviteErr.message || "Falha ao enviar convite." };
  }

  const newUser = invited.user;
  if (!newUser?.id) {
    return { ok: false, message: "Convite enviado, mas o usuário não retornou id." };
  }

  const displayName = (newUser.user_metadata?.name as string | undefined)?.trim() || email.split("@")[0] || "Profissional";

  const { error: upsertErr } = await admin.from("profiles").upsert(
    {
      id: newUser.id,
      email: newUser.email ?? email,
      name: displayName,
      phone: "",
      role: "barbeiro",
      barbearia_id: params.barbeariaId,
      is_admin: false,
      status: "pendente",
    },
    { onConflict: "id" },
  );

  if (upsertErr) {
    return {
      ok: false,
      message: upsertErr.message || "Convite ok, mas falhou ao vincular o perfil à barbearia.",
    };
  }

  return { ok: true };
}

export async function removeBarberFromShop(
  env: TeamEnv,
  params: { barberId: string; ownerBarbeariaId: string; ownerUserId: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (params.barberId === params.ownerUserId) {
    return { ok: false, message: "Você não pode remover a si mesmo." };
  }

  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);

  const { data: target, error: fetchErr } = await admin
    .from("profiles")
    .select("id, barbearia_id, is_admin")
    .eq("id", params.barberId)
    .maybeSingle();

  if (fetchErr || !target) {
    return { ok: false, message: "Profissional não encontrado." };
  }
  if (target.barbearia_id !== params.ownerBarbeariaId) {
    return { ok: false, message: "Este profissional não pertence à sua barbearia." };
  }
  if (target.is_admin) {
    return { ok: false, message: "Não é possível remover outro administrador." };
  }

  const { error: updErr } = await admin
    .from("profiles")
    .update({ barbearia_id: null })
    .eq("id", params.barberId)
    .eq("barbearia_id", params.ownerBarbeariaId);

  if (updErr) {
    return { ok: false, message: updErr.message || "Falha ao remover da equipe." };
  }

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

  const { data, error } = await admin
    .from("profiles")
    .select("id, name, email, phone, is_admin, status")
    .eq("barbearia_id", params.barbeariaId)
    .order("is_admin", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return { ok: false, message: error.message || "Não foi possível listar a equipe." };
  }

  return { ok: true, members: (data ?? []) as TeamMemberRow[] };
}
