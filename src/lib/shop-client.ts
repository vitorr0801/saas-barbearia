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

// 🚀 TIER-1: Tipagem Sincronizada com a nova estrutura do Banco de Dados
export type BarbershopSettings = {
  id: string;
  name: string | null;
  neighborhood: string | null;
  categories: string[] | null;
  cover_image: string | null;
  
  // Endereço Integrado
  zip_code?: string | null;
  street?: string | null;
  address_number?: string | null;
  complement?: string | null;
  city?: string | null;
  state?: string | null;
  
  // Redes Sociais e Contato
  instagram_url?: string | null;
  whatsapp?: string | null; // 👈 CORREÇÃO: Alinhado com a coluna real do banco
  location?: string | null; // Tipado como string para receber as coordenadas POINT()
};

export async function getMyShopSettings(): Promise<{ shop?: BarbershopSettings; error?: string }> {
  const headers = await authHeader();
  if (!headers) return { error: "Faça login novamente." };

  const res = await fetch("/api/shop/me", { method: "GET", headers });
  const data = await parseJson<{ shop?: BarbershopSettings }>(res);
  if (!res.ok) return { error: data.error || "Não foi possível carregar a barbearia." };
  return { shop: data.shop };
}

// 🚀 TIER-1: Input atualizado para trafegar o Payload correto pro backend
export async function updateMyShopSettings(input: {
  name: string;
  neighborhood?: string;
  categories: string[];
  cover_image: string | null;
  zip_code?: string;
  street?: string;
  address_number?: string;
  complement?: string;
  city?: string;
  state?: string;
  instagram_url?: string;
  whatsapp?: string; // 👈 CORREÇÃO: Enviando o dado com o nome correto
  location?: string | null;
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