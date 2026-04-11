/** Detecta erro de cadastro quando o e-mail já existe (Supabase / GoTrue). */
export function isEmailAlreadyRegisteredError(err: unknown): boolean {
  if (err == null) return false;
  const any = err as { message?: string; code?: string };
  const msg = String(any.message ?? "").toLowerCase();
  const code = String(any.code ?? "").toLowerCase();

  if (msg.includes("already registered")) return true;
  if (msg.includes("already been registered")) return true;
  if (msg.includes("user already registered")) return true;
  if (msg.includes("email address is already registered")) return true;
  if (msg.includes("duplicate") && msg.includes("user")) return true;
  if (code === "user_already_exists") return true;

  return false;
}
