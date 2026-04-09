import { supabase } from "@/lib/supabase";

type ApiErrorBody = { error?: string };

async function parseJson<T>(res: Response): Promise<T & ApiErrorBody> {
  try {
    return (await res.json()) as T & ApiErrorBody;
  } catch {
    return {} as T & ApiErrorBody;
  }
}

async function authHeader(): Promise<{ Authorization: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return { Authorization: `Bearer ${session.access_token}` };
}

export type BarbershopSettings = {
  id: string;
  name: string | null;
  neighborhood: string | null;
  categories: string[] | null;
  cover_image: string | null;
};

export async function getMyShopSettings(): Promise<{ shop?: BarbershopSettings; error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: "Faça login novamente." };

  const res = await fetch("/api/shop/me", { method: "GET", headers });
  const data = await parseJson<{ shop?: BarbershopSettings }>(res);
  if (!res.ok) return { error: data.error || "Não foi possível carregar a barbearia." };
  return { shop: data.shop };
}

export async function updateMyShopSettings(input: {
  name: string;
  neighborhood: string;
  categories: string[];
  cover_image: string | null;
}): Promise<{ error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: "Faça login novamente." };

  const res = await fetch("/api/shop/update", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{}>(res);
  if (!res.ok) return { error: data.error || "Não foi possível salvar." };
  return {};
}

