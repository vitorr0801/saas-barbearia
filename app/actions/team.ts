"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { createSupabaseAdminClient } from "../../lib/supabase/admin";

export type TeamActionState = {
  error: string | null;
  ok?: boolean;
};

const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido.");

function siteUrlForRedirect(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VITE_APP_URL ||
    "http://localhost:8080"
  ).replace(/\/$/, "");
}

export async function inviteBarberAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsedEmail.success) {
    return { error: parsedEmail.error.issues[0]?.message ?? "E-mail inválido." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return { error: "Sessão inválida. Faça login novamente." };
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("is_admin, barbearia_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !profile?.barbearia_id || !profile.is_admin || profile.role !== "barbeiro") {
      return { error: "Apenas o dono da barbearia pode convidar profissionais." };
    }

    const admin = createSupabaseAdminClient();

    // 🚀 TIER-1: CRIAÇÃO DO INGRESSO VIP (TOKEN UUID)
    // Em vez de o frontend criar, o servidor backend toma a responsabilidade.
    const { data: newInvite, error: inviteErr } = await admin
      .from("invites")
      .insert({
        email: parsedEmail.data,
        barbearia_id: profile.barbearia_id,
        status: "pendente",
      })
      .select("id")
      .single();

    if (inviteErr) {
      return { error: "Falha ao gerar o token de segurança no banco de dados." };
    }

    // 🔗 MONTAGEM DO LINK BLINDADO
    // Agora o servidor obriga o Supabase a enviar o e-mail com a nossa Rota Customizada e o Token.
    const redirectTo = `${siteUrlForRedirect()}/convite-aceito?token=${newInvite.id}`;

    // 📧 DISPARO DO E-MAIL
    const { data: invited, error: mailErr } = await admin.auth.admin.inviteUserByEmail(
      parsedEmail.data,
      {
        redirectTo,
        data: { role: "barbeiro", invite_token: newInvite.id }, // Injeta o token nos metadados por segurança
      },
    );

    if (mailErr) {
      // Degradação elegante: Se o e-mail falhar, removemos o convite para não poluir o banco.
      await admin.from("invites").delete().eq("id", newInvite.id);
      return { error: mailErr.message || "Falha ao enviar e-mail de convite." };
    }

    /* 🧹 OTIMIZAÇÃO DE RECURSOS:
      Removemos o bloco antigo que fazia um "upsert" na tabela `profiles`.
      Motivo: Nós já delegamos a responsabilidade de criar/vincular o perfil 
      para o `AuthCallbackBarbeiro.tsx` no exato momento em que ele aceita o convite.
      Isso evita bancos de dados cheios de usuários inativos ou duplicados.
    */

    return { error: null, ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro crítico ao processar o convite.";
    return { error: msg };
  }
}

export async function removeBarberAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const barberId = z.string().min(1).safeParse(formData.get("barber_id"));
  if (!barberId.success) {
    return { error: "Identificador do profissional inválido." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return { error: "Sessão inválida." };
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("is_admin, barbearia_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !profile?.barbearia_id || !profile.is_admin || profile.role !== "barbeiro") {
      return { error: "Sem permissão para remover membros." };
    }

    if (barberId.data === user.id) {
      return { error: "Você não pode remover a si mesmo." };
    }

    const admin = createSupabaseAdminClient();

    const { data: target, error: fetchErr } = await admin
      .from("profiles")
      .select("id, barbearia_id, is_admin")
      .eq("id", barberId.data)
      .maybeSingle();

    if (fetchErr || !target) {
      return { error: "Profissional não encontrado." };
    }
    if (target.barbearia_id !== profile.barbearia_id) {
      return { error: "Este profissional não pertence à sua barbearia." };
    }
    if (target.is_admin) {
      return { error: "Não é possível remover outro administrador." };
    }

    const { error: updErr } = await admin
      .from("profiles")
      .update({ barbearia_id: null })
      .eq("id", barberId.data)
      .eq("barbearia_id", profile.barbearia_id);

    if (updErr) {
      return { error: updErr.message || "Falha ao remover da equipe." };
    }

    return { error: null, ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro ao remover.";
    return { error: msg };
  }
}