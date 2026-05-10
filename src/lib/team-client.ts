import { supabase } from "@/lib/supabase";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_admin: boolean | null;
  status: string | null;
};

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

export async function inviteBarberByEmail(
  email: string, 
  jobTitle: string = 'Barbeiro', 
  providesServices: boolean = true
): Promise<{ error?: string }> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanEmail = email.trim().toLowerCase();
    
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

    const inviteId = crypto.randomUUID();

    const { error: inviteError } = await supabase
      .from('invites')
      .insert({
        id: inviteId,
        email: cleanEmail,
        barbearia_id: profile.barbearia_id,
        status: 'pendente',
        job_title: jobTitle,
        provides_services: providesServices
      });

    if (inviteError) {
       console.error("Erro ao inserir convite:", inviteError);
       return { error: "Não foi possível criar o convite. Ele já existe?" };
    }

    const inviteLink = `${origin}/login-barbeiro?type=invite&token=${inviteId}&email=${encodeURIComponent(cleanEmail)}`;    const { error: apiError } = await fetchTeamApi("/invite", {
      method: "POST",
      body: JSON.stringify({ 
        email: cleanEmail, 
        invite_link: inviteLink,
        invite_id: inviteId 
      }),
    });

    return { error: apiError };

  } catch (err: any) {
    console.error("[Invite Flow Error]:", err);
    return { error: err.message || "Falha ao processar convite." };
  }
}

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