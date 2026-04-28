import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  type ServicesEnv,
  verifyUserFromAccessToken,
  listMasterServicesForShop,
  createMasterService,
  updateMasterService,
  deleteMasterService,
  listBarberServiceToggles,
  upsertBarberServiceToggle,
  getBarbershopSettings,
  updateBarbershopSettings,
} from "./services-logic";

function parseEnv(v: Record<string, string>): ServicesEnv {
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
    throw new Error("services-vite-plugin: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  if (!serviceRoleKey) {
    throw new Error("services-vite-plugin: defina SUPABASE_SERVICE_ROLE_KEY para /api/services/*.");
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

function servicesMiddleware(env: ServicesEnv) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    const path = url.pathname;

    const isServices = path.startsWith("/api/services/");
    const isShop = path.startsWith("/api/shop/");
    if (!isServices && !isShop) {
      next();
      return;
    }

    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      sendJson(res, 401, { error: "Authorization Bearer obrigatório." });
      return;
    }

    const who = await verifyUserFromAccessToken(env, token);
    if (!who.ok) {
      sendJson(res, 403, { error: who.message });
      return;
    }

    // ---------- SHOP SETTINGS (admin only) ----------
    if (path === "/api/shop/me") {
      if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
      if (who.role !== "barbeiro" || !who.isAdmin || !who.barbeariaId) {
        return sendJson(res, 403, { error: "Apenas o dono pode acessar configurações." });
      }
      const result = await getBarbershopSettings(env, { barbeariaId: who.barbeariaId });
      if (!result.ok) return sendJson(res, 400, { error: result.message });
      return sendJson(res, 200, { shop: result.shop });
    }

    if (path === "/api/shop/update") {
      if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
      if (who.role !== "barbeiro" || !who.isAdmin || !who.barbeariaId) {
        return sendJson(res, 403, { error: "Apenas o dono pode atualizar configurações." });
      }
      const raw = await readBody(req).catch(() => "");
      let body: any = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        return sendJson(res, 400, { error: "JSON inválido." });
      }
      
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const neighborhood = typeof body.neighborhood === "string" ? body.neighborhood.trim() : "";
      const categories = Array.isArray(body.categories) ? body.categories.filter((c: any) => typeof c === "string") : [];
      const coverImage = typeof body.cover_image === "string" && body.cover_image.trim() ? body.cover_image.trim() : null;
      
      if (!name || name.length < 2) return sendJson(res, 400, { error: "Nome inválido." });

      // 🚀 TIER-1: Coletando o Payload Completo
      const result = await updateBarbershopSettings(env, {
        barbeariaId: who.barbeariaId,
        name,
        neighborhood,
        categories,
        coverImage,
        zip_code: typeof body.zip_code === "string" ? body.zip_code.trim() : null,
        street: typeof body.street === "string" ? body.street.trim() : null,
        address_number: typeof body.address_number === "string" ? body.address_number.trim() : null,
        complement: typeof body.complement === "string" ? body.complement.trim() : null,
        city: typeof body.city === "string" ? body.city.trim() : null,
        state: typeof body.state === "string" ? body.state.trim() : null,
        instagram_url: typeof body.instagram_url === "string" ? body.instagram_url.trim() : null,
        phone: typeof body.phone === "string" ? body.phone.trim() : null,
        location: body.location !== undefined ? body.location : null,
      });

      if (!result.ok) return sendJson(res, 400, { error: result.message });
      return sendJson(res, 200, { ok: true });
    }

    // ---------- MASTER SERVICES (admin only) ----------
    if (path === "/api/services/master") {
      if (who.role !== "barbeiro" || !who.isAdmin || !who.barbeariaId) {
        return sendJson(res, 403, { error: "Apenas o dono pode gerenciar serviços." });
      }

      if (req.method === "GET") {
        const result = await listMasterServicesForShop(env, { barbeariaId: who.barbeariaId });
        if (!result.ok) return sendJson(res, 400, { error: result.message });
        return sendJson(res, 200, { services: result.services });
      }

      const raw = await readBody(req).catch(() => "");
      let body: any = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        return sendJson(res, 400, { error: "JSON inválido." });
      }

      if (req.method === "POST") {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const price = typeof body.price === "number" ? body.price : Number(body.price);
        const durationMin =
          typeof body.duration_min === "number" ? body.duration_min : Number(body.duration_min);
        if (!name) return sendJson(res, 400, { error: "Nome obrigatório." });
        if (!Number.isFinite(price) || price <= 0) return sendJson(res, 400, { error: "Preço inválido." });
        if (!Number.isFinite(durationMin) || durationMin <= 0) return sendJson(res, 400, { error: "Duração inválida." });
        const result = await createMasterService(env, {
          barbeariaId: who.barbeariaId,
          name,
          price,
          durationMin,
        });
        if (!result.ok) return sendJson(res, 400, { error: result.message });
        return sendJson(res, 200, { service: result.service });
      }

      if (req.method === "PUT") {
        const serviceId = typeof body.id === "string" ? body.id : "";
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const price = typeof body.price === "number" ? body.price : Number(body.price);
        const durationMin =
          typeof body.duration_min === "number" ? body.duration_min : Number(body.duration_min);
        if (!serviceId) return sendJson(res, 400, { error: "id obrigatório." });
        if (!name) return sendJson(res, 400, { error: "Nome obrigatório." });
        if (!Number.isFinite(price) || price <= 0) return sendJson(res, 400, { error: "Preço inválido." });
        if (!Number.isFinite(durationMin) || durationMin <= 0) return sendJson(res, 400, { error: "Duração inválida." });
        const result = await updateMasterService(env, {
          barbeariaId: who.barbeariaId,
          serviceId,
          name,
          price,
          durationMin,
        });
        if (!result.ok) return sendJson(res, 400, { error: result.message });
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === "DELETE") {
        const serviceId = typeof body.id === "string" ? body.id : "";
        if (!serviceId) return sendJson(res, 400, { error: "id obrigatório." });
        const result = await deleteMasterService(env, { barbeariaId: who.barbeariaId, serviceId });
        if (!result.ok) return sendJson(res, 400, { error: result.message });
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 405, { error: "Method not allowed" });
    }

    // ---------- BARBER TOGGLES (barber logged) ----------
    if (path === "/api/services/barber") {
      if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
      if (who.role !== "barbeiro" || !who.barbeariaId) {
        return sendJson(res, 403, { error: "Apenas barbeiros podem acessar." });
      }
      const result = await listBarberServiceToggles(env, {
        barbeariaId: who.barbeariaId,
        barberId: who.userId,
      });
      if (!result.ok) return sendJson(res, 400, { error: result.message });
      return sendJson(res, 200, { services: result.services, activeServiceIds: result.activeServiceIds });
    }

    if (path === "/api/services/barber/toggle") {
      if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
      if (who.role !== "barbeiro" || !who.barbeariaId) {
        return sendJson(res, 403, { error: "Apenas barbeiros podem atualizar serviços." });
      }
      const raw = await readBody(req).catch(() => "");
      let body: any = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        return sendJson(res, 400, { error: "JSON inválido." });
      }
      const serviceId = typeof body.service_id === "string" ? body.service_id : "";
      const isActive = Boolean(body.is_active);
      if (!serviceId) return sendJson(res, 400, { error: "service_id obrigatório." });

      const result = await upsertBarberServiceToggle(env, {
        barbeariaId: who.barbeariaId,
        barberId: who.userId,
        serviceId,
        isActive,
      });
      if (!result.ok) return sendJson(res, 400, { error: result.message });
      return sendJson(res, 200, { ok: true });
    }

    sendJson(res, 404, { error: "Not found" });
  };
}

export function servicesApiVitePlugin(envVars: Record<string, string>): Plugin {
  let env: ServicesEnv | null = null;
  try {
    env = parseEnv(envVars);
  } catch (e) {
    console.warn(
      "[barberpro-services-api]",
      e instanceof Error ? e.message : "Variáveis Supabase incompletas.",
    );
  }

  const mw = env?.serviceRoleKey ? servicesMiddleware(env) : null;

  return {
    name: "barberpro-services-api",
    configureServer(server) {
      if (mw) server.middlewares.use(mw);
      else {
        console.warn(
          "[barberpro-services-api] SUPABASE_SERVICE_ROLE_KEY ausente — rotas /api/services/* desativadas.",
        );
      }
    },
    configurePreviewServer(server) {
      if (mw) server.middlewares.use(mw);
    },
  };
}