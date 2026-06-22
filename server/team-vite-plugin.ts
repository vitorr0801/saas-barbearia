import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  type TeamEnv,
  verifyOwnerFromAccessToken,
  inviteBarberForShop,
  removeBarberFromShop,
  listTeamMembersForShop,
} from "./team-logic";

function parseEnv(v: Record<string, string>): TeamEnv {
  const supabaseUrl =
    v.VITE_SUPABASE_URL || v.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey =
    v.VITE_SUPABASE_ANON_KEY ||
    v.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  const serviceRoleKey =
    v.SUPABASE_SERVICE_ROLE_KEY ||
    v.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("team-vite-plugin: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  if (!serviceRoleKey) {
    throw new Error("team-vite-plugin: defina SUPABASE_SERVICE_ROLE_KEY para /api/team/*.");
  }
  return { supabaseUrl, supabaseAnonKey, serviceRoleKey };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function teamMiddleware(teamEnv: TeamEnv) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    const path = url.pathname;

    if (path !== "/api/team/invite" && path !== "/api/team/remove" && path !== "/api/team/list") {
      next();
      return;
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      sendJson(res, 401, { error: "Authorization Bearer obrigatório." });
      return;
    }

    const owner = await verifyOwnerFromAccessToken(teamEnv, token);
    if (!owner.ok) {
      sendJson(res, 403, { error: owner.message });
      return;
    }

    if (path === "/api/team/list") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }
      try {
        const result = await listTeamMembersForShop(teamEnv, { barbeariaId: owner.barbeariaId });
        if (!result.ok) {
          sendJson(res, 400, { error: result.message });
          return;
        }
        sendJson(res, 200, { members: result.members });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro interno.";
        sendJson(res, 500, { error: msg });
      }
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    let raw: string;
    try {
      raw = await readBody(req);
    } catch {
      sendJson(res, 400, { error: "Corpo inválido." });
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      sendJson(res, 400, { error: "JSON inválido." });
      return;
    }

    try {
      if (path === "/api/team/invite") {
        const email = typeof body.email === "string" ? body.email : "";
        
        // 🚀 O FIM DA GAMBIARRA DO REDIRECT
        const inviteLink = typeof body.invite_link === "string" && body.invite_link
          ? body.invite_link
          : `http://${host}/cadastro?role=barbeiro`;

        // 🚀 TIER-1: Extraindo o ID explícito que o frontend gerou
        const inviteId = typeof body.invite_id === "string" ? body.invite_id : undefined;

        const result = await inviteBarberForShop(teamEnv, {
          email,
          barbeariaId: owner.barbeariaId,
          inviteLink,
          inviteId, // Passamos o ID gerado para a camada de lógica
        });
        
        if (!result.ok) {
          sendJson(res, 400, { error: result.message });
          return;
        }
        sendJson(res, 200, { ok: true });
        return;
      }

      const barberId = typeof body.barber_id === "string" ? body.barber_id : "";
      if (!barberId) {
        sendJson(res, 400, { error: "barber_id obrigatório." });
        return;
      }
      const result = await removeBarberFromShop(teamEnv, {
        barberId,
        ownerBarbeariaId: owner.barbeariaId,
        ownerUserId: owner.userId,
      });
      if (!result.ok) {
        sendJson(res, 400, { error: result.message });
        return;
      }
      sendJson(res, 200, { ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro interno.";
      sendJson(res, 500, { error: msg });
    }
  };
}

export function teamApiVitePlugin(env: Record<string, string>): Plugin {
  let teamEnv: TeamEnv | null = null;
  try {
    teamEnv = parseEnv(env);
  } catch (e) {
    console.warn(
      "[barberpro-team-api]",
      e instanceof Error ? e.message : "Variáveis Supabase incompletas.",
    );
  }

  const mw = teamEnv?.serviceRoleKey ? teamMiddleware(teamEnv) : null;

  return {
    name: "barberpro-team-api",
    configureServer(server) {
      if (mw) {
        server.middlewares.use(mw);
      } else {
        console.warn(
          "[barberpro-team-api] SUPABASE_SERVICE_ROLE_KEY ausente — rotas /api/team/* desativadas.",
        );
      }
    },
    configurePreviewServer(server) {
      if (mw) {
        server.middlewares.use(mw);
      }
    },
  };
}