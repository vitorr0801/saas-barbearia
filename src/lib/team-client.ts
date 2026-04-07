import { supabase } from "@/lib/supabase";

type ApiErrorBody = { error?: string };
type TeamListBody<T> = { members?: T[]; error?: string };

async function parseJson(res: Response): Promise<ApiErrorBody> {
  try {
    return (await res.json()) as ApiErrorBody;
  } catch {
    return {};
  }
}

async function parseJsonTeamList<T>(res: Response): Promise<TeamListBody<T>> {
  try {
    return (await res.json()) as TeamListBody<T>;
  } catch {
    return {};
  }
}

/**
 * Convite via middleware Vite (dev/preview) ou proxy em produção.
 * Exige SUPABASE_SERVICE_ROLE_KEY no servidor e rota POST /api/team/invite.
 */
export async function inviteBarberByEmail(email: string): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: "Faça login novamente." };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const res = await fetch("/api/team/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email: email.trim(), origin }),
  });

  const json = await parseJson(res);
  if (!res.ok) {
    return { error: json.error || "Não foi possível enviar o convite." };
  }
  return {};
}

export async function removeBarberById(barberId: string): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: "Faça login novamente." };
  }

  const res = await fetch("/api/team/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ barber_id: barberId }),
  });

  const json = await parseJson(res);
  if (!res.ok) {
    return { error: json.error || "Não foi possível remover o profissional." };
  }
  return {};
}

export type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_admin: boolean | null;
  status: string | null;
};

export async function listTeamMembers(): Promise<{ members: TeamMember[]; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { members: [], error: "Faça login novamente." };
  }

  const res = await fetch("/api/team/list", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const data = await parseJsonTeamList<TeamMember>(res);
  console.log("Resposta da API de Equipe:", data);

  if (!res.ok) {
    return { members: [], error: data.error || "Não foi possível carregar a equipe." };
  }

  return { members: (data.members ?? []) as TeamMember[] };
}
