import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error("Supabase URL ausente (NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL).");
  }
  return url;
}

/**
 * Cliente com Service Role — apenas em ambiente servidor (Server Actions, API, middleware Node).
 * Nunca importar em código que vá para o bundle do browser.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente. Necessário para convites (auth.admin).",
    );
  }
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
