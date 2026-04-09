"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageIcon, Plus, Settings2, Trash2, Pencil, UploadCloud, Scissors } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMyShopSettings, updateMyShopSettings } from "@/lib/shop-client";
import {
  createMasterServiceClient,
  deleteMasterServiceClient,
  listMasterServices,
  type MasterService,
  updateMasterServiceClient,
} from "@/lib/services-client";

function parseTags(input: string): string[] {
  return input
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function BarbershopSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Shop
  const [shopName, setShopName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return coverImageUrl;
    return URL.createObjectURL(coverFile);
  }, [coverFile, coverImageUrl]);

  useEffect(() => {
    return () => {
      if (coverFile && coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverFile, coverPreviewUrl]);

  // Master services
  const [services, setServices] = useState<MasterService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MasterService | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [svcSaving, setSvcSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ shop, error: shopErr }, { services: svc, error: svcErr }] = await Promise.all([
        getMyShopSettings(),
        listMasterServices(),
      ]);
      if (shopErr) throw new Error(shopErr);
      if (svcErr) throw new Error(svcErr);
      setShopName(shop?.name ?? "");
      setNeighborhood(shop?.neighborhood ?? "");
      setCategories(Array.isArray(shop?.categories) ? (shop!.categories as string[]) : []);
      setCoverImageUrl(shop?.cover_image ?? null);
      setServices(svc);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar configurações.";
      toast.error(msg);
    } finally {
      setLoading(false);
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const addCategories = () => {
    const parts = parseTags(categoryInput);
    if (parts.length === 0) return;
    setCategories((prev) => Array.from(new Set([...prev, ...parts])));
    setCategoryInput("");
  };

  const removeCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  const uploadCoverIfNeeded = async (): Promise<string | null> => {
    if (!coverFile) return coverImageUrl ?? null;
    if (!coverFile.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem válido.");
    const maxBytes = 6 * 1024 * 1024;
    if (coverFile.size > maxBytes) throw new Error("A imagem é muito grande (máx. 6MB).");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) throw new Error("Sessão inválida.");

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
    if (uploadError) throw new Error(uploadError.message || "Falha ao enviar a imagem.");

    const { data: pub } = supabase.storage.from("barbershop-assets").getPublicUrl(fileName);
    return pub?.publicUrl ?? null;
  };

  const handleSaveShop = async () => {
    const name = shopName.trim();
    const neigh = neighborhood.trim();
    if (name.length < 2) return toast.error("Informe o nome da barbearia.");
    if (neigh.length < 2) return toast.error("Informe o bairro.");

    setSaving(true);
    const toastId = toast.loading("Salvando configurações...");
    try {
      const cover = await uploadCoverIfNeeded();
      const { error } = await updateMyShopSettings({
        name,
        neighborhood: neigh,
        categories,
        cover_image: cover,
      });
      if (error) throw new Error(error);
      setCoverImageUrl(cover);
      setCoverFile(null);
      toast.success("Configurações salvas!", { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar.";
      toast.error(msg, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const openCreateService = () => {
    setEditingService(null);
    setSvcName("");
    setSvcPrice("");
    setSvcDuration("");
    setServiceModalOpen(true);
  };

  const openEditService = (s: MasterService) => {
    setEditingService(s);
    setSvcName(s.name);
    setSvcPrice(String(s.price));
    setSvcDuration(String(s.duration_min));
    setServiceModalOpen(true);
  };

  const saveService = async () => {
    const name = svcName.trim();
    const price = Number(String(svcPrice).replace(",", "."));
    const durationMin = Number(String(svcDuration).replace(",", "."));
    if (!name) return toast.error("Nome obrigatório.");
    if (!Number.isFinite(price) || price <= 0) return toast.error("Preço inválido.");
    if (!Number.isFinite(durationMin) || durationMin <= 0) return toast.error("Duração inválida.");

    setSvcSaving(true);
    const toastId = toast.loading(editingService ? "Atualizando serviço..." : "Criando serviço...");
    try {
      if (!editingService) {
        const { service, error } = await createMasterServiceClient({
          name,
          price,
          duration_min: durationMin,
        });
        if (error) throw new Error(error);
        if (service) setServices((prev) => [...prev, service].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const { error } = await updateMasterServiceClient({
          ...editingService,
          name,
          price,
          duration_min: durationMin,
        });
        if (error) throw new Error(error);
        setServices((prev) =>
          prev
            .map((s) => (s.id === editingService.id ? { ...s, name, price, duration_min: durationMin } : s))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      toast.success("Serviço salvo!", { id: toastId });
      setServiceModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar serviço.";
      toast.error(msg, { id: toastId });
    } finally {
      setSvcSaving(false);
    }
  };

  const deleteService = async (s: MasterService) => {
    const toastId = toast.loading("Excluindo serviço...");
    try {
      const { error } = await deleteMasterServiceClient(s.id);
      if (error) throw new Error(error);
      setServices((prev) => prev.filter((x) => x.id !== s.id));
      toast.success("Serviço excluído.", { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao excluir.";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-3xl py-6 space-y-6">
        <div className="dash-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Settings2 className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
              </div>
              <h1 className="text-xl font-black uppercase italic tracking-tight text-foreground">
                Configurações da Barbearia
              </h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Atualize dados da unidade e gerencie sua lista master de serviços.
              </p>
            </div>
          </div>
        </div>

        {/* Card 1: dados da barbearia */}
        <section className="dash-card space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              Dados da barbearia
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nome</Label>
                <Input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  disabled={saving}
                  className="h-11 rounded-xl bg-secondary/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Bairro <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  disabled={saving}
                  className="h-11 rounded-xl bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Categorias</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Corte, Barba, Infantil"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCategories();
                      }
                    }}
                    disabled={saving}
                    className="h-10 rounded-xl bg-secondary/50 text-sm"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl"
                    onClick={addCategories}
                    disabled={saving || !categoryInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => removeCategory(cat)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/25"
                      >
                        {cat} <span className="opacity-70">×</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Sem categorias ainda (opcional).</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Foto de capa</Label>
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {coverFile ? coverFile.name : coverImageUrl ? "Imagem atual definida" : "Nenhuma imagem"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">PNG/JPG/WebP até 6MB</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        id="settings-cover"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={saving}
                        onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-xl"
                        disabled={saving}
                        onClick={() => document.getElementById("settings-cover")?.click()}
                      >
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Escolher
                      </Button>
                      {coverFile && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={saving}
                          onClick={() => setCoverFile(null)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>

                  {coverPreviewUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <img
                        src={coverPreviewUrl}
                        alt="Preview da foto de capa"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full rounded-xl border border-border bg-muted flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        Sem foto
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => void handleSaveShop()}
                disabled={saving}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-none hover:bg-primary/90"
              >
                {saving ? "Salvando..." : "Salvar dados da barbearia"}
              </Button>
            </div>
          )}
        </section>

        {/* Card 2: serviços master */}
        <section className="dash-card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                Serviços master
              </h2>
            </div>
            <Button
              type="button"
              onClick={openCreateService}
              className="h-10 rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-none hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar novo serviço
            </Button>
          </div>

          {servicesLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando serviços...</div>
          ) : services.length === 0 ? (
            <div className="rounded-xl border border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
              Nenhum serviço cadastrado ainda. Crie sua lista master para a equipe ativar no perfil.
            </div>
          ) : (
            <ul className="space-y-2">
              {services.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-border bg-secondary/20 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      R$ {Number(s.price).toFixed(2).replace(".", ",")} • {s.duration_min} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => openEditService(s)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => void deleteService(s)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Dica: cada barbeiro ativa seus serviços no perfil
            </Badge>
          </div>
        </section>
      </div>

      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest text-[12px]">
              {editingService ? "Editar serviço" : "Novo serviço"}
            </DialogTitle>
            <DialogDescription>
              Defina nome, preço e duração. Isso compõe a lista master da sua barbearia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nome</Label>
              <Input
                value={svcName}
                onChange={(e) => setSvcName(e.target.value)}
                className="h-11 rounded-xl bg-secondary/50"
                disabled={svcSaving}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Preço (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={svcPrice}
                  onChange={(e) => setSvcPrice(e.target.value)}
                  className="h-11 rounded-xl bg-secondary/50"
                  disabled={svcSaving}
                  placeholder="Ex: 55"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Duração (min)</Label>
                <Input
                  inputMode="numeric"
                  value={svcDuration}
                  onChange={(e) => setSvcDuration(e.target.value)}
                  className="h-11 rounded-xl bg-secondary/50"
                  disabled={svcSaving}
                  placeholder="Ex: 30"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setServiceModalOpen(false)} disabled={svcSaving}>
              Cancelar
            </Button>
            <Button
              className="rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-none hover:bg-primary/90"
              onClick={() => void saveService()}
              disabled={svcSaving}
            >
              {svcSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

