"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  ImageIcon, Plus, Settings2, Trash2, Pencil, UploadCloud, 
  Scissors, MapPin, Store, Instagram, Phone, Search, Clock, Tag
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMyShopSettings, updateMyShopSettings } from "@/lib/shop-client";
import {
  createMasterServiceClient,
  deleteMasterServiceClient,
  listMasterServices,
  type MasterService,
  updateMasterServiceClient,
} from "@/lib/services-client";
import { formatDuration } from "@/lib/formatDuration";
import { cn } from "@/lib/utils";

// --- HELPERS ---
function formatCEP(value: string) {
  return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function parseTags(input: string): string[] {
  return input.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
}

const DIAS_SEMANA = [
  { id: 0, label: "Dom" }, { id: 1, label: "Seg" }, { id: 2, label: "Ter" },
  { id: 3, label: "Qua" }, { id: 4, label: "Qui" }, { id: 5, label: "Sex" }, { id: 6, label: "Sáb" }
];

export default function BarbershopSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "local" | "servicos">("perfil");

  // Shop Core
  const [shopName, setShopName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [shopPhone, setShopPhone] = useState("");

  // Endereço Completo
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);

  const [savedLocation, setSavedLocation] = useState<any | null>(null);
  const initialAddressRef = useRef<string>("");

  // Serviços Master
  const [services, setServices] = useState<MasterService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  
  // 🚀 ESTADOS DA PROMOÇÃO
  const [svcPromoPercentage, setSvcPromoPercentage] = useState("0");
  const [svcPromoDays, setSvcPromoDays] = useState<number[]>([]);
  const [svcSaving, setSvcSaving] = useState(false);

  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return coverImageUrl;
    return URL.createObjectURL(coverFile);
  }, [coverFile, coverImageUrl]);

  useEffect(() => {
    return () => {
      if (coverFile && coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverFile, coverPreviewUrl]);

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
      setCategories(Array.isArray(shop?.categories) ? (shop!.categories as string[]) : []);
      setCoverImageUrl(shop?.cover_image ?? null);
      setInstagramUrl(shop?.instagram_url ?? "");
      setShopPhone(shop?.phone ?? "");

      setZipCode(shop?.zip_code ?? "");
      setStreet(shop?.street ?? "");
      setAddressNumber(shop?.address_number ?? "");
      setComplement(shop?.complement ?? "");
      setNeighborhood(shop?.neighborhood ?? "");
      setCity(shop?.city ?? "");
      setState(shop?.state ?? "");

      setSavedLocation(shop?.location ?? null);
      initialAddressRef.current = `${shop?.street ?? ""}|${shop?.address_number ?? ""}|${shop?.neighborhood ?? ""}|${shop?.city ?? ""}|${shop?.state ?? ""}`;

      setServices(svc || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar configurações.");
    } finally {
      setLoading(false);
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setZipCode(formatted);
    const rawCep = formatted.replace(/\D/g, "");

    if (rawCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro || "");
          setNeighborhood(data.bairro || "");
          setCity(data.localidade || "");
          setState(data.uf || "");
          setTimeout(() => numberInputRef.current?.focus(), 100);
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP.");
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const parts = parseTags(categoryInput);
      if (parts.length === 0) return;
      
      setCategories((prev) => {
        const combined = Array.from(new Set([...prev, ...parts]));
        
        if (combined.length > 3) {
          toast.error("Escolha apenas as 3 especialidades principais da sua vitrine.");
          return combined.slice(0, 3);
        }
        
        return combined;
      });
      setCategoryInput("");
    }
  };

  const removeCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  const uploadCoverIfNeeded = async (): Promise<string | null> => {
    if (!coverFile) return coverImageUrl ?? null;
    if (!coverFile.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
    if (coverFile.size > 6 * 1024 * 1024) throw new Error("A imagem é muito grande (máx. 6MB).");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error("Sessão inválida.");

    const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `cover_${user.id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("barbershop-assets")
      .upload(fileName, coverFile, { cacheControl: "3600", upsert: false });
      
    if (uploadError) throw new Error("Falha ao enviar a imagem.");

    const { data: pub } = supabase.storage.from("barbershop-assets").getPublicUrl(fileName);
    return pub?.publicUrl ?? null;
  };

  const fetchIntelligentCoordinates = async (streetStr: string, numStr: string, neighStr: string, cityStr: string, stateStr: string) => {
    try {
      const queries = [
        `${streetStr}, ${numStr}, ${neighStr}, ${cityStr}, ${stateStr}, Brasil`, 
        `${streetStr}, ${cityStr}, ${stateStr}, Brasil`, 
        `${neighStr}, ${cityStr}, ${stateStr}, Brasil`,  
        `${cityStr}, ${stateStr}, Brasil`                
      ];

      for (const q of queries) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          return `POINT(${data[0].lon} ${data[0].lat})`;
        }
      }
      return null;
    } catch { return null; }
  };

  const handleSaveShop = async () => {
    if (shopName.trim().length < 2) return toast.error("O nome da barbearia é obrigatório.");

    setSaving(true);
    const toastId = toast.loading("Salvando configurações...");
    
    try {
      const cover = await uploadCoverIfNeeded();
      
      let locationPoint = savedLocation;
      const currentAddressForm = `${street}|${addressNumber}|${neighborhood}|${city}|${state}`;

      if (currentAddressForm !== initialAddressRef.current || !savedLocation) {
        if (city && state) {
           locationPoint = await fetchIntelligentCoordinates(street, addressNumber, neighborhood, city, state);
           initialAddressRef.current = currentAddressForm; 
        }
      }

      const { error } = await updateMyShopSettings({
        name: shopName.trim(),
        categories,
        cover_image: cover,
        instagram_url: instagramUrl,
        phone: shopPhone,
        zip_code: zipCode,
        street,
        address_number: addressNumber,
        complement,
        neighborhood,
        city,
        state,
        location: locationPoint
      });
      
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

  const togglePromoDay = (dayId: number) => {
    setSvcPromoDays(prev => prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]);
  };

  const openCreateService = () => {
    setEditingService(null); 
    setSvcName(""); 
    setSvcPrice(""); 
    setSvcDuration(""); 
    setSvcPromoPercentage("0"); 
    setSvcPromoDays([]); 
    setServiceModalOpen(true);
  };

  const openEditService = (s: any) => {
    setEditingService(s); 
    setSvcName(s.name); 
    setSvcPrice(String(s.price)); 
    setSvcDuration(String(s.duration_min)); 
    setSvcPromoPercentage(String(s.promo_percentage || 0));
    setSvcPromoDays(s.promo_days || []);
    setServiceModalOpen(true);
  };

  const saveService = async () => {
    const name = svcName.trim();
    const price = Number(String(svcPrice).replace(",", "."));
    const durationMin = Number(String(svcDuration).replace(",", "."));
    const promoPercentage = Number(svcPromoPercentage);
    
    if (!name || price <= 0 || durationMin <= 0) return toast.error("Preencha os campos obrigatórios corretamente.");

    setSvcSaving(true);
    const toastId = toast.loading(editingService ? "Atualizando..." : "Criando...");
    
    try {
      const payload = {
        name, 
        price, 
        duration_min: durationMin,
        promo_percentage: promoPercentage,
        promo_days: svcPromoDays
      };

      if (!editingService) {
        const { error } = await createMasterServiceClient(payload as any);
        if (error) throw new Error(error);
      } else {
        const { error } = await updateMasterServiceClient({ ...editingService, ...payload } as any);
        if (error) throw new Error(error);
      }
      
      const { services: updatedServices, error: fetchErr } = await listMasterServices();
      if (fetchErr) throw new Error(fetchErr);
      
      setServices(updatedServices || []);
      toast.success("Serviço salvo com sucesso!", { id: toastId });
      setServiceModalOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar serviço.", { id: toastId });
    } finally {
      setSvcSaving(false);
    }
  };

  const deleteService = async (s: MasterService) => {
    const toastId = toast.loading("Excluindo serviço...");
    try {
      const { error } = await deleteMasterServiceClient(s.id);
      if (error) throw new Error(error);
      
      const { services: updatedServices } = await listMasterServices();
      setServices(updatedServices || []);
      
      toast.success("Excluído com sucesso.", { id: toastId });
    } catch (e: unknown) {
      toast.error("Erro ao excluir.", { id: toastId });
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-8 pb-24">
        
        <header className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-widest text-primary">
            <Settings2 className="w-3 h-3" /> Gestão da Unidade
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-foreground">
            Sua <span className="text-primary">Barbearia</span>.
          </h1>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            Personalize a sua vitrine online, atualize o endereço e cadastre seus serviços master.
          </p>
        </header>

        <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("perfil")}
            className={cn("flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap flex justify-center items-center gap-2", activeTab === "perfil" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground")}
          >
            <Store className="w-4 h-4" /> Perfil & Vitrine
          </button>
          <button 
            onClick={() => setActiveTab("local")}
            className={cn("flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap flex justify-center items-center gap-2", activeTab === "local" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground")}
          >
            <MapPin className="w-4 h-4" /> Localização
          </button>
          <button 
            onClick={() => setActiveTab("servicos")}
            className={cn("flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap flex justify-center items-center gap-2", activeTab === "servicos" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground")}
          >
            <Scissors className="w-4 h-4" /> Serviços Master
          </button>
        </div>

        <div className="dash-card border-border/40 bg-card/30 backdrop-blur-xl relative overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ABA 1: PERFIL */}
              <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", activeTab === "perfil" ? "block" : "hidden")}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Nome Oficial</Label>
                    <Input value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Tags Principais (Máx. 3)</Label>
                    <Input placeholder="Ex: Cabelo, Barba" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} onKeyDown={handleCategoryKeyDown} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {categories.map((cat) => (
                          <span key={cat} onClick={() => removeCategory(cat)} className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 cursor-pointer transition-colors">
                            {cat} <span className="text-[14px]">×</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5"><Instagram className="w-3 h-3"/> Instagram (Opcional)</Label>
                    <Input placeholder="@suabarbearia" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3"/> WhatsApp de Contato</Label>
                    <Input placeholder="(11) 99999-9999" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Foto de Capa</Label>
                  <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 p-2 relative overflow-hidden group">
                    {coverPreviewUrl ? (
                      <div className="relative">
                        <img src={coverPreviewUrl} alt="Capa" className="h-48 w-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                           <Button type="button" variant="outline" className="rounded-xl border-white/20 bg-black/50 backdrop-blur text-white hover:bg-black/70" onClick={() => document.getElementById("settings-cover")?.click()}>Trocar Foto</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 w-full flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-primary" /></div>
                        <p className="text-xs text-muted-foreground font-semibold">Nenhuma capa definida</p>
                        <Button type="button" variant="secondary" className="rounded-xl mt-2" onClick={() => document.getElementById("settings-cover")?.click()}><UploadCloud className="h-4 w-4 mr-2"/> Escolher Arquivo</Button>
                      </div>
                    )}
                    <input id="settings-cover" type="file" accept="image/*" className="hidden" disabled={saving} onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>

                <Button onClick={handleSaveShop} disabled={saving} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest mt-6 shadow-lg shadow-emerald-900/20">
                  {saving ? "Sincronizando..." : "Salvar Perfil da Barbearia"}
                </Button>
              </div>

              {/* ABA 2: LOCALIZAÇÃO */}
              <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", activeTab === "local" ? "block" : "hidden")}>
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
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} className="bg-secondary/50 border-none h-12" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número</Label>
                    <Input ref={numberInputRef} value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} className="bg-secondary/50 border-none h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compl.</Label>
                    <Input value={complement} onChange={(e) => setComplement(e.target.value)} className="bg-secondary/50 border-none h-12" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bairro</Label>
                    <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="bg-secondary/50 border-none h-12" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cidade</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="bg-secondary/50 border-none h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">UF</Label>
                    <Input maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className="bg-secondary/50 border-none h-12 uppercase text-center" />
                  </div>
                </div>

                <Button onClick={handleSaveShop} disabled={saving} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest mt-6 shadow-lg shadow-emerald-900/20">
                  {saving ? "Atualizando Mapa..." : "Atualizar Endereço"}
                </Button>
              </div>

              {/* ABA 3: SERVIÇOS MASTER E PROMOÇÕES */}
              <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", activeTab === "servicos" ? "block" : "hidden")}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted-foreground font-medium">Cardápio Global e Dias Promocionais.</p>
                  <Button onClick={openCreateService} className="h-10 rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-none hover:bg-primary/90 shrink-0">
                    <Plus className="h-4 w-4 mr-1.5" /> Novo Serviço
                  </Button>
                </div>

                {servicesLoading ? (
                  <div className="py-8 text-center flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-card/20 p-8 text-center flex flex-col items-center gap-3">
                    <Scissors className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm font-semibold text-muted-foreground">O Cardápio Master está vazio.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {services.map((s: any) => {
                      // 🚀 VERIFICAÇÃO SEGURA: Transforma em Number para evitar falsos positivos do Javascript
                      const promoPerc = Number(s.promo_percentage) || 0;
                      const hasPromo = promoPerc > 0;
                      const promoDaysText = hasPromo && Array.isArray(s.promo_days) ? s.promo_days.map((d: number) => DIAS_SEMANA[d].label).join(", ") : "";

                      return (
                        <div key={s.id} className="group rounded-2xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              {s.name}
                              
                              {/* 🚀 O TERNÁRIO MÁGICO: Se não tiver promoção, retorna "null", evitando que ele mostre o zero na tela */}
                              {hasPromo ? (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase px-2 py-0.5 whitespace-nowrap">
                                  {promoPerc}% OFF ({promoDaysText})
                                </Badge>
                              ) : null}
                              
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[11px] font-mono text-primary font-bold">R$ {Number(s.price).toFixed(2).replace(".", ",")}</span>
                              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDuration(s.duration_min)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border/50 hover:bg-white/5" onClick={() => openEditService(s)}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-destructive/20 hover:bg-destructive/10" onClick={() => void deleteService(s)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card shadow-2xl p-6 sm:p-8">
          <DialogHeader className="mb-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="font-black uppercase italic tracking-tighter text-xl text-foreground">
              {editingService ? "Editar Serviço" : "Criar Serviço Master"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Nome do Serviço</Label>
              <Input value={svcName} onChange={(e) => setSvcName(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-none" disabled={svcSaving} placeholder="Ex: Corte Degrade" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Preço (R$)</Label>
                <Input inputMode="decimal" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-none font-mono" disabled={svcSaving} placeholder="50,00" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Minutos</Label>
                <Input inputMode="numeric" value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-none font-mono" disabled={svcSaving} placeholder="30" />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Tag className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Promoção Dinâmica</span>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-500/70">Desconto (%)</Label>
                <Input 
                  type="number" 
                  value={svcPromoPercentage} 
                  onChange={(e) => setSvcPromoPercentage(e.target.value)} 
                  className="h-12 rounded-xl bg-background border-emerald-500/20 text-emerald-500 font-black focus-visible:ring-emerald-500" 
                  placeholder="Ex: 20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-500/70">Válido nos Dias</Label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => togglePromoDay(day.id)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border shrink-0",
                        svcPromoDays.includes(day.id) 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : "bg-background border-border text-muted-foreground hover:border-emerald-500/40"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-border flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest" onClick={() => setServiceModalOpen(false)} disabled={svcSaving}>Cancelar</Button>
            <Button className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20" onClick={() => void saveService()} disabled={svcSaving}>
              {svcSaving ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}