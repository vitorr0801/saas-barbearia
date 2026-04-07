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
    const redirectTo = `${siteUrlForRedirect()}/atualizar-senha`;

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      parsedEmail.data,
      {
        redirectTo,
        data: { role: "barbeiro" },
      },
    );

    if (inviteErr) {
      return { error: inviteErr.message || "Falha ao enviar convite." };
    }

    const newUser = invited.user;
    if (!newUser?.id) {
      return { error: "Convite enviado, mas não foi possível obter o id do usuário." };
    }

    const displayName =
      (typeof newUser.user_metadata?.name === "string" && newUser.user_metadata.name.trim()) ||
      parsedEmail.data.split("@")[0] ||
      "Profissional";

    const { error: upsertErr } = await admin.from("profiles").upsert(
      {
        id: newUser.id,
        email: newUser.email ?? parsedEmail.data,
        name: displayName,
        phone: "",
        role: "barbeiro",
        barbearia_id: profile.barbearia_id,
        is_admin: false,
        status: "pendente",
      },
      { onConflict: "id" },
    );

    if (upsertErr) {
      return {
        error:
          upsertErr.message ||
          "Convite enviado, mas falhou ao vincular o perfil. Ajuste o perfil manualmente no Supabase.",
      };
    }

    return { error: null, ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro ao convidar.";
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
