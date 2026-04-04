"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "../../lib/supabase/server";

const setupBarbeariaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome da barbearia deve ter pelo menos 2 caracteres.")
    .max(80, "Nome da barbearia deve ter no maximo 80 caracteres."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalido. Use apenas letras minusculas, numeros e hifens.",
    )
    .min(3, "Slug deve ter pelo menos 3 caracteres.")
    .max(50, "Slug deve ter no maximo 50 caracteres."),
  neighborhood: z
    .string()
    .trim()
    .min(2, "Informe o bairro.")
    .max(120, "Bairro muito longo."),
  categories: z.array(z.string().trim().min(1)).default([]),
  cover_image: z
    .string()
    .trim()
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .refine(
      (s) => s === null || /^https?:\/\/.+/i.test(s),
      "URL da imagem invalida ou deixe em branco.",
    ),
});

export type SetupBarbeariaActionState = {
  error: string | null;
};

const DEFAULT_ERROR = "Nao foi possivel concluir o setup da barbearia.";

function parseCategoriesFromFormData(formData: FormData): string[] {
  const raw = formData.get("categories_json");
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim()))];
      }
    } catch {
      return [];
    }
  }
  const all = formData.getAll("categories").map(String).filter(Boolean);
  return [...new Set(all.map((s) => s.trim()).filter(Boolean))];
}

export async function setupBarbeariaAction(
  _prevState: SetupBarbeariaActionState,
  formData: FormData,
): Promise<SetupBarbeariaActionState> {
  const categories = parseCategoriesFromFormData(formData);

  const parsed = setupBarbeariaSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    neighborhood: formData.get("neighborhood"),
    categories,
    cover_image: formData.get("cover_image") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados de formulario invalidos.",
    };
  }

  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "Usuario nao autenticado." };
    }

    const { data: newBarbearia, error: insertError } = await supabase
      .from("barbearias")
      .insert({
        owner_id: user.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        neighborhood: parsed.data.neighborhood,
        categories: parsed.data.categories,
        cover_image: parsed.data.cover_image,
      })
      .select("id")
      .single();

    if (insertError || !newBarbearia?.id) {
      if (insertError?.code === "23505") {
        return { error: "Esse slug ja esta em uso. Escolha outro." };
      }
      return { error: DEFAULT_ERROR };
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        barbearia_id: newBarbearia.id,
        is_admin: true,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      await supabase.from("barbearias").delete().eq("id", newBarbearia.id);
      return { error: DEFAULT_ERROR };
    }

    redirect("/dashboard/admin");
  } catch {
    return { error: DEFAULT_ERROR };
  }
}
