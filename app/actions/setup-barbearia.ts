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
});

export type SetupBarbeariaActionState = {
  error: string | null;
};

const DEFAULT_ERROR = "Nao foi possivel concluir o setup da barbearia.";

export async function setupBarbeariaAction(
  _prevState: SetupBarbeariaActionState,
  formData: FormData,
): Promise<SetupBarbeariaActionState> {
  const parsed = setupBarbeariaSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
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
