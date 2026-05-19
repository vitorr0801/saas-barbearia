import { supabase } from "@/lib/supabase";

type ApiErrorBody = { error?: string };

async function parseJson<T>(res: Response): Promise<T & ApiErrorBody> {
  try {
    return (await res.json()) as T & ApiErrorBody;
  } catch {
    return {} as T & ApiErrorBody;
  }
}

// 🚀 TIER-1: Tipagem atualizada para reconhecer a "description"
export type MasterService = {
  id: string;
  name: string;
  description?: string | null; // 👈 O Elo Perdido! Agora o front-end enxerga a descrição.
  price: number;
  duration_min: number;
  promo_percentage?: number;
  promo_days?: number[];
};

async function authHeader(): Promise<{ Authorization: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function listMasterServices(): Promise<{ services: MasterService[]; error?: string }> {
  const headers = await authHeader();
  if (!headers) return { services: [], error: "Faça login novamente." };

  const res = await fetch("/api/services/master", { method: "GET", headers });
  const data = await parseJson<{ services?: MasterService[] }>(res);
  if (!res.ok) return { services: [], error: data.error || "Não foi possível carregar os serviços." };
  return { services: data.services ?? [] };
}

// 🚀 TIER-1: Input agora trafega a description para a API
export async function createMasterServiceClient(input: {
  name: string;
  description?: string; // 👈 Liberado para passar na criação
  price: number;
  duration_min: number;
  promo_percentage?: number;
  promo_days?: number[];
}): Promise<{ service?: MasterService; error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: "Faça login novamente." };

  const res = await fetch("/api/services/master", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ service?: MasterService }>(res);
  if (!res.ok) return { error: data.error || "Não foi possível criar o serviço." };
  return { service: data.service };
}

// 🚀 COMO O TIPO DE INPUT É 'MasterService', O UPDATE JÁ LEVA A DESCRIÇÃO JUNTO AUTOMATICAMENTE
export async function updateMasterServiceClient(input: MasterService): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: "Faça login novamente." };

  const res = await fetch("/api/services/master", {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{}>(res);
  if (!res.ok) return { error: data.error || "Não foi possível atualizar o serviço." };
  return {};
}

export async function deleteMasterServiceClient(id: string): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: "Faça login novamente." };

  const res = await fetch("/api/services/master", {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const data = await parseJson<{}>(res);
  if (!res.ok) return { error: data.error || "Não foi possível excluir o serviço." };
  return {};
}

export async function listMyServiceToggles(): Promise<{
  services: MasterService[];
  activeServiceIds: string[];
  error?: string;
}> {
  const headers = await authHeader();
  if (!headers) return { services: [], activeServiceIds: [], error: "Faça login novamente." };

  const res = await fetch("/api/services/barber", { method: "GET", headers });
  const data = await parseJson<{ services?: MasterService[]; activeServiceIds?: string[] }>(res);
  if (!res.ok) {
    return { services: [], activeServiceIds: [], error: data.error || "Não foi possível carregar seus serviços." };
  }
  return {
    services: data.services ?? [],
    activeServiceIds: data.activeServiceIds ?? [],
  };
}

export async function toggleMyService(serviceId: string, isActive: boolean): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: "Faça login novamente." };

  const res = await fetch("/api/services/barber/toggle", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ service_id: serviceId, is_active: isActive }),
  });
  const data = await parseJson<{}>(res);
  if (!res.ok) return { error: data.error || "Não foi possível atualizar." };
  return {};
}