import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ImageIcon, Link2, MapPin, Tags, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { cn } from "@/lib/utils";

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const CATEGORY_PRESETS = [
  "Corte",
  "Barba",
  "Combo",
  "Barba terapêutica",
  "Coloração",
  "Hidratação",
  "Sobrancelha",
  "Infantil",
] as const;

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug inválido: use letras minúsculas, números e hífens.",
    )
    .min(3, "Slug deve ter pelo menos 3 caracteres.")
    .max(50, "Slug muito longo."),
  neighborhood: z
    .string()
    .trim()
    .min(2, "Informe o bairro (mínimo 2 caracteres).")
    .max(120, "Bairro muito longo."),
  categories: z
    .array(z.string().trim().min(1))
    .transform((arr) => [...new Set(arr)])
    .default([]),
});

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser, currentUser } = useAuth();
  const [barbeariaName, setBarbeariaName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [neighborhood, setNeighborhood] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [customTagInput, setCustomTagInput] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return null;
    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(barbeariaName));
    }
  }, [barbeariaName, slugTouched]);

  const toggleCategory = (label: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (checked) next.add(label);
      else next.delete(label);
      return next;
    });
  };

  const addCustomTags = () => {
    const parts = customTagInput
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setCustomTags((prev) => {
      const merged = new Set([...prev, ...parts]);
      return Array.from(merged);
    });
    setCustomTagInput("");
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.barbearia_id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const categoriesArray = [
      ...Array.from(selectedCategories),
      ...customTags,
    ];

    const parsed = onboardingSchema.safeParse({
      name: barbeariaName,
      slug,
      neighborhood,
      categories: categoriesArray,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Criando sua barbearia...");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      let coverImagePublicUrl: string | null = null;
      if (coverFile) {
        if (!coverFile.type.startsWith("image/")) {
          throw new Error("Selecione um arquivo de imagem válido.");
        }
        const maxBytes = 6 * 1024 * 1024; // 6MB
        if (coverFile.size > maxBytes) {
          throw new Error("A imagem é muito grande (máx. 6MB).");
        }

        toast.loading("Enviando foto de capa...", { id: toastId });

        const ext =
          (coverFile.name.split(".").pop() || "").toLowerCase() ||
          (coverFile.type.split("/").pop() || "jpg").toLowerCase();
        const fileName = `cover_${user.id}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("barbershop-assets")
          .upload(fileName, coverFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: coverFile.type || undefined,
          });

        if (uploadError) {
          throw new Error(uploadError.message || "Falha ao enviar a imagem.");
        }

        const { data: pub } = supabase.storage
          .from("barbershop-assets")
          .getPublicUrl(fileName);

        coverImagePublicUrl = pub?.publicUrl ?? null;
      }

      toast.loading("Salvando dados da barbearia...", { id: toastId });

      const { data: created, error: insertError } = await supabase
        .from("barbearias")
        .insert({
          owner_id: user.id,
          name: parsed.data.name,
          slug: parsed.data.slug,
          neighborhood: parsed.data.neighborhood,
          categories: parsed.data.categories,
          cover_image: coverImagePublicUrl,
        })
        .select("id")
        .single();

      if (insertError || !created?.id) {
        if (insertError?.code === "23505") {
          throw new Error("Este slug já está em uso. Escolha outro.");
        }
        throw insertError ?? new Error("Não foi possível criar a barbearia.");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          barbearia_id: created.id,
          is_admin: true,
        })
        .eq("id", user.id);

      if (profileError) {
        await supabase.from("barbearias").delete().eq("id", created.id);
        throw profileError;
      }

      await refreshUser();
      toast.success("Barbearia configurada!", { id: toastId });
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao concluir o setup.";
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    barbeariaName.trim().length >= 2 &&
    slug.trim().length >= 3 &&
    neighborhood.trim().length >= 2;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">
              Setup da Barbearia
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Dados da sua unidade para o catálogo BarberPro
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="shop-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Nome da barbearia
              </Label>
              <Input
                id="shop-name"
                placeholder="Ex: Barbearia Elite"
                value={barbeariaName}
                onChange={(e) => setBarbeariaName(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50"
                disabled={isSubmitting}
                autoComplete="organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-slug" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Link2 className="h-3.5 w-3.5" />
                Slug (URL)
              </Label>
              <Input
                id="shop-slug"
                placeholder="barbearia-elite"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                      .slice(0, 50),
                  );
                }}
                className="h-12 rounded-xl bg-secondary/50 font-mono text-sm"
                disabled={isSubmitting}
                spellCheck={false}
              />
              <p className="text-[10px] text-muted-foreground">
                Gerado automaticamente a partir do nome; você pode editar.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Bairro <span className="text-destructive">*</span>
              </Label>
              <Input
                id="neighborhood"
                placeholder="Ex: Asa Sul, Centro..."
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50"
                disabled={isSubmitting}
                autoComplete="address-level3"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Tags className="h-3.5 w-3.5" />
                Categorias <span className="font-normal normal-case text-[10px] text-muted-foreground">(opcional)</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_PRESETS.map((cat) => (
                  <label
                    key={cat}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm cursor-pointer hover:bg-secondary/50",
                      selectedCategories.has(cat) && "border-primary/40 bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={selectedCategories.has(cat)}
                      onCheckedChange={(c) => toggleCategory(cat, c === true)}
                      disabled={isSubmitting}
                    />
                    <span className="truncate">{cat}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Outras (separe por vírgula)"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTags();
                    }
                  }}
                  className="h-10 rounded-xl bg-secondary/50 text-sm"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 rounded-xl"
                  onClick={addCustomTags}
                  disabled={isSubmitting || !customTagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {customTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {customTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeCustomTag(tag)}
                      className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/25"
                      disabled={isSubmitting}
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-image" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                Foto de capa <span className="font-normal normal-case text-[10px] text-muted-foreground">(upload, opcional)</span>
              </Label>
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {coverFile ? coverFile.name : "Nenhuma imagem selecionada"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      PNG/JPG/WebP até 6MB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setCoverFile(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl"
                      disabled={isSubmitting}
                      onClick={() => document.getElementById("cover-image")?.click()}
                    >
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Escolher
                    </Button>
                    {coverFile && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        disabled={isSubmitting}
                        onClick={() => setCoverFile(null)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>

                {coverPreviewUrl && (
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <img
                      src={coverPreviewUrl}
                      alt="Preview da foto de capa"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Esta imagem aparece no seu perfil público. Você pode trocar depois.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-sm"
            >
              {isSubmitting ? "Salvando..." : "Concluir e ir ao painel"}
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
