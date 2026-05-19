"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageIcon, Settings2, UploadCloud, MapPin, Store, Instagram, Phone, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMyShopSettings, updateMyShopSettings } from "@/lib/shop-client";
import { cn } from "@/lib/utils";

// --- HELPERS ---
function formatCEP(value: string) {
  return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function parseTags(input: string): string[] {
  return input.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
}

export default function BarbershopSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "local">("perfil");

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
      const { shop, error: shopErr } = await getMyShopSettings();
      if (shopErr) throw new Error(shopErr);

      setShopName(shop?.name ?? "");
      setCategories(Array.isArray(shop?.categories) ? (shop!.categories as string[]) : []);
      setCoverImageUrl(shop?.cover_image ?? null);
      setInstagramUrl(shop?.instagram_url ?? "");
      setShopPhone(shop?.whatsapp ?? "");
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
          toast.error("Escolha apenas as 3 especialidades principais.");
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
        whatsapp: shopPhone.replace(/\D/g, ""), 
        zip_code: zipCode,
        street,
        address_number: addressNumber,
        complement,
        neighborhood,
        city,
        state,
        location: locationPoint
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

  return (
    <div className="container max-w-5xl mx-auto space-y-8 overflow-x-hidden">
      
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
            Personalize a sua vitrine online e atualize o endereço.
          </p>
        </div>
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
      </div>

      <div className="dash-card border-border/40 bg-card/30 backdrop-blur-xl relative overflow-hidden min-h-[400px] mb-8 p-6 sm:p-8">
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
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5"><Instagram className="w-3 h-3"/> Instagram</Label>
                  <Input placeholder="@suabarbearia" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} disabled={saving} className="h-12 rounded-xl bg-secondary/50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3"/> WhatsApp</Label>
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
          </>
        )}
      </div>
    </div>
  );
}