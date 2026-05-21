"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ImageIcon, Settings2, UploadCloud, MapPin, Store,
  Instagram, Phone, Search, Clock, CreditCard, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMyShopSettings, updateMyShopSettings } from "@/lib/shop-client";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCEP(value: string) {
  return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function parseTags(input: string): string[] {
  return input.split(/[,;]/).map(t => t.trim()).filter(Boolean);
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DAYS = [
  { key: "1", label: "Segunda" },
  { key: "2", label: "Terça" },
  { key: "3", label: "Quarta" },
  { key: "4", label: "Quinta" },
  { key: "5", label: "Sexta" },
  { key: "6", label: "Sábado" },
  { key: "0", label: "Domingo" },
];

const PAYMENT_OPTIONS = [
  { id: "dinheiro",  label: "Dinheiro",          icon: "💵" },
  { id: "pix",       label: "Pix",               icon: "🔑" },
  { id: "debito",    label: "Cartão de Débito",  icon: "💳" },
  { id: "credito",   label: "Cartão de Crédito", icon: "💳" },
];

type DaySchedule = { open: string; close: string; closed: boolean };
type WorkingHours = Record<string, DaySchedule>;

const DEFAULT_DAY: DaySchedule = { open: "09:00", close: "18:00", closed: false };
const DEFAULT_HOURS: WorkingHours = Object.fromEntries(
  DAYS.map(d => [d.key, { ...DEFAULT_DAY }])
);

type TabId = "perfil" | "info" | "horarios" | "local";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BarbershopSettings() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("perfil");

  // Perfil
  const [shopName, setShopName]             = useState("");
  const [categories, setCategories]         = useState<string[]>([]);
  const [categoryInput, setCategoryInput]   = useState("");
  const [coverImageUrl, setCoverImageUrl]   = useState<string | null>(null);
  const [coverFile, setCoverFile]           = useState<File | null>(null);
  const [instagramUrl, setInstagramUrl]     = useState("");
  const [shopPhone, setShopPhone]           = useState("");

  // Informações
  const [about, setAbout]                   = useState("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Horários
  const [workingHours, setWorkingHours]     = useState<WorkingHours>(DEFAULT_HOURS);

  // Endereço
  const [zipCode, setZipCode]               = useState("");
  const [street, setStreet]                 = useState("");
  const [addressNumber, setAddressNumber]   = useState("");
  const [complement, setComplement]         = useState("");
  const [neighborhood, setNeighborhood]     = useState("");
  const [city, setCity]                     = useState("");
  const [state, setState]                   = useState("");
  const [isFetchingCep, setIsFetchingCep]   = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);
  const [savedLocation, setSavedLocation]   = useState<any | null>(null);
  const initialAddressRef                   = useRef<string>("");

  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return coverImageUrl;
    return URL.createObjectURL(coverFile);
  }, [coverFile, coverImageUrl]);

  useEffect(() => {
    return () => { if (coverFile && coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl); };
  }, [coverFile, coverPreviewUrl]);

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadAll = async () => {
    setLoading(true);
    try {
      const { shop, error: shopErr } = await getMyShopSettings();
      if (shopErr) throw new Error(shopErr);

      setShopName(shop?.name ?? "");
      setCategories(Array.isArray(shop?.categories) ? (shop!.categories as string[]) : []);
      setCoverImageUrl(shop?.cover_image ?? null);
      setInstagramUrl(shop?.instagram_url ?? "");
      setShopPhone(shop?.whatsapp ?? "");
      setAbout(shop?.about ?? "");
      setPaymentMethods(Array.isArray(shop?.payment_methods) ? (shop!.payment_methods as string[]) : []);

      // Horários: merge com DEFAULT_HOURS para garantir todos os dias
      const savedHours = (shop?.working_hours ?? {}) as WorkingHours;
      setWorkingHours(
        Object.fromEntries(
          DAYS.map(d => [d.key, savedHours[d.key] ?? { ...DEFAULT_DAY }])
        )
      );

      setZipCode(shop?.zip_code ?? "");
      setStreet(shop?.street ?? "");
      setAddressNumber(shop?.address_number ?? "");
      setComplement(shop?.complement ?? "");
      setNeighborhood(shop?.neighborhood ?? "");
      setCity(shop?.city ?? "");
      setState(shop?.state ?? "");
      setSavedLocation(shop?.location ?? null);
      initialAddressRef.current = `${shop?.street ?? ""}|${shop?.address_number ?? ""}|${shop?.neighborhood ?? ""}|${shop?.city ?? ""}|${shop?.state ?? ""}`;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, []);

  // ── CEP ─────────────────────────────────────────────────────────────────────

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setZipCode(formatted);
    const raw = formatted.replace(/\D/g, "");
    if (raw.length === 8) {
      setIsFetchingCep(true);
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setCity(data.localidade || "");
          setState(data.uf || "");
          setTimeout(() => numberInputRef.current?.focus(), 100);
        }
      } catch { toast.error("Erro ao buscar CEP."); }
      finally { setIsFetchingCep(false); }
    }
  };

  // ── Categories ──────────────────────────────────────────────────────────────

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const parts = parseTags(categoryInput);
    if (!parts.length) return;
    setCategories(prev => {
      const combined = Array.from(new Set([...prev, ...parts]));
      if (combined.length > 3) { toast.error("Escolha apenas as 3 especialidades principais."); return combined.slice(0, 3); }
      return combined;
    });
    setCategoryInput("");
  };

  // ── Horários ─────────────────────────────────────────────────────────────────

  const updateDay = (key: string, field: keyof DaySchedule, value: string | boolean) => {
    setWorkingHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // ── Payment ──────────────────────────────────────────────────────────────────

  const togglePayment = (id: string) => {
    setPaymentMethods(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // ── Upload cover ─────────────────────────────────────────────────────────────

  const uploadCoverIfNeeded = async (): Promise<string | null> => {
    if (!coverFile) return coverImageUrl ?? null;
    if (!coverFile.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
    if (coverFile.size > 6 * 1024 * 1024) throw new Error("Imagem muito grande (máx. 6MB).");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error("Sessão inválida.");
    const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const { error } = await supabase.storage.from("barbershop-assets")
      .upload(`cover_${user.id}_${Date.now()}.${ext}`, coverFile, { cacheControl: "3600", upsert: false });
    if (error) throw new Error("Falha ao enviar a imagem.");
    const { data: pub } = supabase.storage.from("barbershop-assets")
      .getPublicUrl(`cover_${user.id}_${Date.now()}.${ext}`);
    // Rebusca a URL correta após o upload
    const { data: list } = await supabase.storage.from("barbershop-assets").list("", { limit: 1, search: `cover_${user.id}` });
    if (list && list.length > 0) {
      const { data: p } = supabase.storage.from("barbershop-assets").getPublicUrl(list[0].name);
      return p?.publicUrl ?? null;
    }
    return pub?.publicUrl ?? null;
  };

  // ── Geocode ──────────────────────────────────────────────────────────────────

  const fetchCoordinates = async (streetStr: string, numStr: string, neighStr: string, cityStr: string, stateStr: string) => {
    try {
      const queries = [
        `${streetStr}, ${numStr}, ${neighStr}, ${cityStr}, ${stateStr}, Brasil`,
        `${streetStr}, ${cityStr}, ${stateStr}, Brasil`,
        `${neighStr}, ${cityStr}, ${stateStr}, Brasil`,
        `${cityStr}, ${stateStr}, Brasil`,
      ];
      for (const q of queries) {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data?.length > 0) return `POINT(${data[0].lon} ${data[0].lat})`;
      }
      return null;
    } catch { return null; }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (shopName.trim().length < 2) return toast.error("O nome da barbearia é obrigatório.");
    setSaving(true);
    const toastId = toast.loading("Salvando configurações...");
    try {
      const cover = await uploadCoverIfNeeded();
      let locationPoint = savedLocation;
      const currentAddress = `${street}|${addressNumber}|${neighborhood}|${city}|${state}`;
      if (currentAddress !== initialAddressRef.current || !savedLocation) {
        if (city && state) {
          locationPoint = await fetchCoordinates(street, addressNumber, neighborhood, city, state);
          initialAddressRef.current = currentAddress;
        }
      }

      const { error } = await updateMyShopSettings({
        name:            shopName.trim(),
        categories,
        cover_image:     cover,
        instagram_url:   instagramUrl,
        whatsapp:        shopPhone.replace(/\D/g, ""),
        about:           about.trim() || null,
        payment_methods: paymentMethods,
        working_hours:   workingHours,
        zip_code:        zipCode,
        street,
        address_number:  addressNumber,
        complement,
        neighborhood,
        city,
        state,
        location:        locationPoint,
      } as any);

      if (error) throw new Error(error);
      setCoverImageUrl(cover);
      setCoverFile(null);
      if (locationPoint) setSavedLocation(locationPoint);
      toast.success("Barbearia atualizada com sucesso!", { id: toastId });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "perfil",   label: "Perfil",      icon: <Store   className="w-3.5 h-3.5" /> },
    { id: "info",     label: "Informações", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "horarios", label: "Horários",    icon: <Clock   className="w-3.5 h-3.5" /> },
    { id: "local",    label: "Localização", icon: <MapPin  className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="container max-w-5xl mx-auto space-y-8 overflow-x-hidden pb-10">

      <header className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Settings2 className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gestão da Unidade</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Sua <span className="text-primary">Barbearia</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Personalize a sua vitrine online.
          </p>
        </div>
      </header>

      {/* Abas */}
      <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border overflow-x-auto no-scrollbar gap-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex justify-center items-center gap-1.5",
              activeTab === tab.id
                ? "bg-card text-primary shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >{tab.icon}{tab.label}</button>
        ))}
      </div>

      <div className="rounded-[2rem] border border-border/40 bg-card/30 backdrop-blur-xl relative overflow-hidden min-h-[400px] p-6 sm:p-8">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── ABA: PERFIL ── */}
            <div className={cn("space-y-6 animate-in fade-in duration-300", activeTab === "perfil" ? "block" : "hidden")}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Nome Oficial</Label>
                  <Input value={shopName} onChange={e => setShopName(e.target.value)} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Tags Principais (Máx. 3)</Label>
                  <Input placeholder="Ex: Cabelo, Barba" value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value)}
                    onKeyDown={handleCategoryKeyDown} disabled={saving}
                    className="h-12 rounded-xl bg-secondary/50 border-none" />
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {categories.map(cat => (
                        <span key={cat} onClick={() => setCategories(p => p.filter(c => c !== cat))}
                          className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 cursor-pointer transition-colors">
                          {cat} <span className="text-[14px]">×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Instagram className="w-3 h-3"/> Instagram
                  </Label>
                  <Input placeholder="@suabarbearia" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3 h-3"/> WhatsApp
                  </Label>
                  <Input placeholder="(11) 99999-9999" value={shopPhone} onChange={e => setShopPhone(e.target.value)} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/40">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Foto de Capa</Label>
                <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 p-2 relative overflow-hidden group">
                  {coverPreviewUrl ? (
                    <div className="relative">
                      <img src={coverPreviewUrl} alt="Capa" className="h-48 w-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Button type="button" variant="outline" className="rounded-xl border-white/20 bg-black/50 backdrop-blur text-white hover:bg-black/70"
                          onClick={() => document.getElementById("settings-cover")?.click()}>Trocar Foto</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 w-full flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-primary" /></div>
                      <p className="text-xs text-muted-foreground font-semibold">Nenhuma capa definida</p>
                      <Button type="button" variant="secondary" className="rounded-xl mt-2"
                        onClick={() => document.getElementById("settings-cover")?.click()}>
                        <UploadCloud className="h-4 w-4 mr-2"/> Escolher Arquivo
                      </Button>
                    </div>
                  )}
                  <input id="settings-cover" type="file" accept="image/*" className="hidden" disabled={saving}
                    onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest mt-6 shadow-lg shadow-emerald-900/20">
                {saving ? "Sincronizando..." : "Salvar Perfil"}
              </Button>
            </div>

            {/* ── ABA: INFORMAÇÕES ── */}
            <div className={cn("space-y-6 animate-in fade-in duration-300", activeTab === "info" ? "block" : "hidden")}>

              {/* Sobre */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3 h-3"/> Sobre a Barbearia
                </Label>
                <Textarea
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  placeholder="Descreva sua barbearia: ambiente, diferenciais, história... (max. 500 caracteres)"
                  maxLength={500}
                  rows={5}
                  disabled={saving}
                  className="rounded-xl bg-secondary/50 border-none resize-none text-sm"
                />
                <p className="text-[10px] text-muted-foreground text-right">{about.length}/500</p>
              </div>

              {/* Formas de pagamento */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3"/> Formas de Pagamento
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PAYMENT_OPTIONS.map(opt => {
                    const active = paymentMethods.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => togglePayment(opt.id)}
                        disabled={saving}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all text-center",
                          active
                            ? "bg-primary/10 border-primary text-primary shadow-inner shadow-primary/5"
                            : "bg-secondary/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        )}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{opt.label}</span>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest mt-6 shadow-lg shadow-emerald-900/20">
                {saving ? "Salvando..." : "Salvar Informações"}
              </Button>
            </div>

            {/* ── ABA: HORÁRIOS ── */}
            <div className={cn("space-y-4 animate-in fade-in duration-300", activeTab === "horarios" ? "block" : "hidden")}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Configure os horários de atendimento por dia da semana
              </p>

              <div className="space-y-3">
                {DAYS.map(({ key, label }) => {
                  const day = workingHours[key] ?? { ...DEFAULT_DAY };
                  return (
                    <div key={key} className={cn(
                      "flex flex-col gap-3 p-4 rounded-2xl border transition-all",
                      day.closed
                        ? "bg-secondary/10 border-border/30 opacity-60"
                        : "bg-card/50 border-border/50"
                    )}>
                      {/* Linha superior: nome + toggle + status */}
                      <div className="flex items-center gap-4">
                        {/* Nome do dia — largura fixa para alinhar todos */}
                        <span className="text-xs font-black uppercase tracking-widest text-foreground w-20 shrink-0">
                          {label}
                        </span>

                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => updateDay(key, "closed", !day.closed)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                            day.closed ? "bg-border" : "bg-primary"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                            day.closed ? "translate-x-1" : "translate-x-6"
                          )}/>
                        </button>

                        {/* Status — largura fixa, nunca sobrepõe */}
                        <span className={cn(
                          "text-[11px] font-bold uppercase tracking-widest shrink-0",
                          day.closed ? "text-muted-foreground/50" : "text-primary"
                        )}>
                          {day.closed ? "Fechado" : "Aberto"}
                        </span>
                      </div>

                      {/* Linha inferior: horários — só aparece quando aberto */}
                      {!day.closed && (
                        <div className="flex items-center gap-3 pl-24">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] font-bold text-muted-foreground shrink-0 w-6">Das</span>
                            <Input
                              type="time"
                              value={day.open}
                              onChange={e => updateDay(key, "open", e.target.value)}
                              disabled={saving}
                              className="h-10 rounded-xl bg-secondary/50 border-none text-sm font-bold flex-1"
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] font-bold text-muted-foreground shrink-0 w-4">às</span>
                            <Input
                              type="time"
                              value={day.close}
                              onChange={e => updateDay(key, "close", e.target.value)}
                              disabled={saving}
                              className="h-10 rounded-xl bg-secondary/50 border-none text-sm font-bold flex-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest mt-6 shadow-lg shadow-emerald-900/20">
                {saving ? "Salvando..." : "Salvar Horários"}
              </Button>
            </div>

            {/* ── ABA: LOCALIZAÇÃO ── */}
            <div className={cn("space-y-6 animate-in fade-in duration-300", activeTab === "local" ? "block" : "hidden")}>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CEP</Label>
                  <div className="relative">
                    <Input placeholder="00000-000" maxLength={9} value={zipCode} onChange={handleCepChange} className="bg-secondary/50 border-none h-12 font-mono" />
                    {isFetchingCep && <Search className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary" />}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rua / Avenida</Label>
                  <Input value={street} onChange={e => setStreet(e.target.value)} className="bg-secondary/50 border-none h-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número</Label>
                  <Input ref={numberInputRef} value={addressNumber} onChange={e => setAddressNumber(e.target.value)} className="bg-secondary/50 border-none h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compl.</Label>
                  <Input value={complement} onChange={e => setComplement(e.target.value)} className="bg-secondary/50 border-none h-12" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bairro</Label>
                  <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="bg-secondary/50 border-none h-12" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cidade</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} className="bg-secondary/50 border-none h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">UF</Label>
                  <Input maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())} className="bg-secondary/50 border-none h-12 uppercase text-center" />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest mt-6 shadow-lg shadow-emerald-900/20">
                {saving ? "Atualizando Mapa..." : "Atualizar Endereço"}
              </Button>
            </div>

          </>
        )}
      </div>
    </div>
  );
}