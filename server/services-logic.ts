/**
 * Lógica de serviços executada apenas no Node (middleware Vite / scripts).
 * Não importar em `src/` do front.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ServicesEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  serviceRoleKey: string;
};

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

export async function verifyUserFromAccessToken(
  env: ServicesEnv,
  accessToken: string,
): Promise<
  | { ok: true; userId: string; barbeariaId: string | null; isAdmin: boolean; role: string | null }
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
    .select("role, is_admin, barbearia_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, message: "Não foi possível validar seu perfil." };
  }

  return {
    ok: true,
    userId: user.id,
    barbeariaId: (profile.barbearia_id as string | null) ?? null,
    isAdmin: Boolean(profile.is_admin),
    role: (profile.role as string | null) ?? null,
  };
}

export type ServiceRow = {
  id: string;
  name: string;
  price: number;
  duration_min: number;
};

export async function listMasterServicesForShop(
  env: ServicesEnv,
  params: { barbeariaId: string },
): Promise<{ ok: true; services: ServiceRow[] } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);
  const { data, error } = await admin
    .from("services")
    .select("id, name, price, duration_min")
    .eq("barbearia_id", params.barbeariaId)
    .order("name", { ascending: true });

  if (error) return { ok: false, message: error.message || "Não foi possível listar serviços." };
  return { ok: true, services: (data ?? []) as ServiceRow[] };
}

export async function createMasterService(
  env: ServicesEnv,
  params: { barbeariaId: string; name: string; price: number; durationMin: number },
): Promise<{ ok: true; service: ServiceRow } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);
  const { data, error } = await admin
    .from("services")
    .insert({
      barbearia_id: params.barbeariaId,
      name: params.name,
      price: params.price,
      duration_min: params.durationMin,
    })
    .select("id, name, price, duration_min")
    .single();

  if (error || !data) return { ok: false, message: error?.message || "Falha ao criar serviço." };
  return { ok: true, service: data as ServiceRow };
}

export async function updateMasterService(
  env: ServicesEnv,
  params: { barbeariaId: string; serviceId: string; name: string; price: number; durationMin: number },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);
  const { error } = await admin
    .from("services")
    .update({
      name: params.name,
      price: params.price,
      duration_min: params.durationMin,
    })
    .eq("id", params.serviceId)
    .eq("barbearia_id", params.barbeariaId);

  if (error) return { ok: false, message: error.message || "Falha ao atualizar serviço." };
  return { ok: true };
}

export async function deleteMasterService(
  env: ServicesEnv,
  params: { barbeariaId: string; serviceId: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);
  const { error } = await admin
    .from("services")
    .delete()
    .eq("id", params.serviceId)
    .eq("barbearia_id", params.barbeariaId);

  if (error) return { ok: false, message: error.message || "Falha ao excluir serviço." };
  return { ok: true };
}

export async function listBarberServiceToggles(
  env: ServicesEnv,
  params: { barbeariaId: string; barberId: string },
): Promise<
  | { ok: true; services: ServiceRow[]; activeServiceIds: string[] }
  | { ok: false; message: string }
> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);

  const { data: master, error: masterErr } = await admin
    .from("services")
    .select("id, name, price, duration_min")
    .eq("barbearia_id", params.barbeariaId)
    .order("name", { ascending: true });

  if (masterErr) {
    return { ok: false, message: masterErr.message || "Falha ao listar serviços da barbearia." };
  }

  const { data: links, error: linksErr } = await admin
    .from("barber_services")
    .select("service_id, is_active")
    .eq("barber_id", params.barberId);

  if (linksErr) {
    return { ok: false, message: linksErr.message || "Falha ao listar seus serviços." };
  }

  const activeIds = (links ?? [])
    .filter((l: any) => l?.is_active)
    .map((l: any) => String(l.service_id));

  return { ok: true, services: (master ?? []) as ServiceRow[], activeServiceIds: activeIds };
}

export async function upsertBarberServiceToggle(
  env: ServicesEnv,
  params: { barbeariaId: string; barberId: string; serviceId: string; isActive: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);

  // Garante que o service_id pertence à barbearia do barbeiro (evita toggle cross-shop)
  const { data: svc, error: svcErr } = await admin
    .from("services")
    .select("id")
    .eq("id", params.serviceId)
    .eq("barbearia_id", params.barbeariaId)
    .maybeSingle();

  if (svcErr || !svc) {
    return { ok: false, message: "Serviço inválido para esta barbearia." };
  }

  const { error } = await admin
    .from("barber_services")
    .upsert(
      {
        barber_id: params.barberId,
        service_id: params.serviceId,
        is_active: params.isActive,
      },
      { onConflict: "barber_id,service_id" },
    );

  if (error) return { ok: false, message: error.message || "Falha ao atualizar seus serviços." };
  return { ok: true };
}

// 🚀 TIER-1: Expandido para suportar todos os dados do Onboarding
export type BarbershopSettingsRow = {
  id: string;
  name: string | null;
  neighborhood: string | null;
  categories: string[] | null;
  cover_image: string | null;
  zip_code: string | null;
  street: string | null;
  address_number: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  instagram_url: string | null;
  phone: string | null;
  location: any | null;
};

export async function getBarbershopSettings(
  env: ServicesEnv,
  params: { barbeariaId: string },
): Promise<{ ok: true; shop: BarbershopSettingsRow } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);
  const { data, error } = await admin
    .from("barbearias")
    // 🚀 O "Feitiço de Abertura": Pede pro banco todas as colunas novas
    .select("id, name, neighborhood, categories, cover_image, zip_code, street, address_number, complement, city, state, instagram_url, phone, location")
    .eq("id", params.barbeariaId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: error?.message || "Não foi possível carregar a barbearia." };
  }
  return { ok: true, shop: data as BarbershopSettingsRow };
}

// 🚀 TIER-1: Expandido para salvar todos os dados
export async function updateBarbershopSettings(
  env: ServicesEnv,
  params: {
    barbeariaId: string;
    name: string;
    neighborhood?: string;
    categories: string[];
    coverImage: string | null;
    zip_code?: string | null;
    street?: string | null;
    address_number?: string | null;
    complement?: string | null;
    city?: string | null;
    state?: string | null;
    instagram_url?: string | null;
    phone?: string | null;
    location?: string | null;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = adminClient(env.supabaseUrl, env.serviceRoleKey);
  const { error } = await admin
    .from("barbearias")
    .update({
      name: params.name,
      neighborhood: params.neighborhood,
      categories: params.categories,
      cover_image: params.coverImage,
      zip_code: params.zip_code,
      street: params.street,
      address_number: params.address_number,
      complement: params.complement,
      city: params.city,
      state: params.state,
      instagram_url: params.instagram_url,
      phone: params.phone,
      location: params.location,
    })
    .eq("id", params.barbeariaId);

  if (error) return { ok: false, message: error.message || "Falha ao atualizar a barbearia." };
  return { ok: true };
}