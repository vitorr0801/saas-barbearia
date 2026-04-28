import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck, Clock, Scissors, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { cn } from "@/lib/utils";

// --- UTILITÁRIOS ---
function slugify(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

function formatCEP(value: string) {
  return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function formatDocument(value: string) {
  const nums = value.replace(/\D/g, "");
  if (nums.length <= 11) {
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").slice(0, 18);
}

// --- SCHEMAS DE VALIDAÇÃO ---
const step1Schema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia."),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido.").min(3).max(50),
  zip_code: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido."),
  street: z.string().trim().min(2, "Rua é obrigatória."),
  address_number: z.string().trim().min(1, "Número é obrigatório."),
  neighborhood: z.string().trim().min(2, "Bairro é obrigatório."),
  city: z.string().trim().min(2, "Cidade é obrigatória."),
  state: z.string().length(2, "UF deve ter 2 letras."),
});

const step2Schema = z.object({
  document: z.string().trim().min(11, "Informe um CPF ou CNPJ válido."),
});

const step3Schema = z.object({
  mainServiceName: z.string().trim().min(2, "Informe o nome do serviço."),
  mainServicePrice: z.string().trim().min(1, "Informe o preço."),
});

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // --- ESTADOS ---
  const [barbeariaName, setBarbeariaName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);

  const [document, setDocument] = useState("");
  const [useDefaultHours, setUseDefaultHours] = useState(true);

  const [mainServiceName, setMainServiceName] = useState("Corte Clássico");
  const [mainServicePrice, setMainServicePrice] = useState("45,00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coverPreviewUrl = useMemo(() => coverFile ? URL.createObjectURL(coverFile) : null, [coverFile]);

  useEffect(() => {
    return () => { if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl); };
  }, [coverPreviewUrl]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(barbeariaName));
  }, [barbeariaName, slugTouched]);

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

  const nextStep = () => {
    if (step === 1) {
      const parsed = step1Schema.safeParse({ name: barbeariaName, slug, zip_code: zipCode, street, address_number: addressNumber, neighborhood, city, state });
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    }
    if (step === 2) {
      const parsed = step2Schema.safeParse({ document });
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // 🚀 TIER-1: Motor de Geocoding Inteligente em Cascata
  const fetchIntelligentCoordinates = async (streetStr: string, numStr: string, neighStr: string, cityStr: string, stateStr: string) => {
    try {
      const queries = [
        `${streetStr}, ${numStr}, ${neighStr}, ${cityStr}, ${stateStr}, Brasil`, // 1. Tenta o endereço exato
        `${streetStr}, ${cityStr}, ${stateStr}, Brasil`, // 2. Tenta Rua + Cidade (Fallback 1)
        `${neighStr}, ${cityStr}, ${stateStr}, Brasil`,  // 3. Tenta Bairro + Cidade (Fallback 2)
        `${cityStr}, ${stateStr}, Brasil`                // 4. Tenta apenas a Cidade (Fallback Final - À prova de NULL)
      ];

      for (const q of queries) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
      return null;
    } catch { return null; }
  };

  const handleSubmit = async () => {
    const parsed = step3Schema.safeParse({ mainServiceName, mainServicePrice });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setIsSubmitting(true);
    const toastId = toast.loading("Finalizando seu setup profissional...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      let coverUrl = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `cover_${user.id}_${Date.now()}.${ext}`;
        await supabase.storage.from("barbershop-assets").upload(fileName, coverFile);
        const { data: pub } = supabase.storage.from("barbershop-assets").getPublicUrl(fileName);
        coverUrl = pub?.publicUrl;
      }

      // 🚀 Aciona o motor invisível
      const coords = await fetchIntelligentCoordinates(street, addressNumber, neighborhood, city, state);

      // 1. Inserir Barbearia
      const { data: barbearia, error: bError } = await supabase.from("barbearias").insert({
        owner_id: user.id,
        name: barbeariaName,
        slug,
        zip_code: zipCode,
        street,
        address_number: addressNumber,
        complement,
        neighborhood,
        city,
        state,
        location: coords ? `POINT(${coords.lng} ${coords.lat})` : null,
        document: document.replace(/\D/g, ""),
        cover_image: coverUrl,
        status: 'active'
      }).select("id").single();

      if (bError) throw bError;

      // 2. Inserir Horários (Quick Start)
      if (useDefaultHours) {
        const workingDays = [1, 2, 3, 4, 5].map(d => ({
          barbearia_id: barbearia.id,
          day_of_week: d,
          start_time: "09:00:00",
          end_time: "18:00:00",
          is_closed: false
        }));
        await supabase.from("barber_work_hours").insert(workingDays);
      }

      // 3. Inserir Serviço no Cardápio Global (tabela: services)
      const { data: masterSvc, error: mErr } = await supabase.from("services").insert({
        barbearia_id: barbearia.id,
        name: mainServiceName,
        price: parseFloat(mainServicePrice.replace(",", ".")),
        duration_min: 30, 
      }).select("id").single();

      if (mErr) throw mErr;

      // 3.1. Vincular o serviço ao perfil do Dono (tabela: barber_services)
      await supabase.from("barber_services").insert({
        barbearia_id: barbearia.id,
        professional_id: user.id,
        service_id: masterSvc.id, 
        custom_name: mainServiceName,
        price: parseFloat(mainServicePrice.replace(",", ".")),
        duration_minutes: 30,
        is_active: true
      });

      // 4. Vincular Perfil como Dono Admin
      await supabase.from("profiles").update({ 
        barbearia_id: barbearia.id, 
        is_admin: true,
        role: 'barbeiro' 
      }).eq("id", user.id);

      await refreshUser();
      
      toast.success("Tudo pronto! Bem-vindo ao time.", { id: toastId });
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);

    } catch (err: any) {
      toast.error(err.message || "Erro no setup.", { id: toastId });
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center px-4 py-8 md:py-12">
      
      <div className="mb-8 md:mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-3 shadow-lg shadow-primary/5">
          <Scissors className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-white">
          Barber<span className="text-primary">Pro</span> Business
        </h1>
      </div>

      <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground mb-4">
            {step === 1 && "Passo 1: Identidade"}
            {step === 2 && "Passo 2: Segurança & Motor"}
            {step === 3 && "Passo 3: Sua Vitrine"}
          </h2>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", step >= i ? "w-12 bg-primary" : "w-4 bg-muted")} />
            ))}
          </div>
        </div>

        <div className="bg-[#11141d] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Barbearia</Label>
                  <Input placeholder="Barbearia Elite" value={barbeariaName} onChange={(e) => setBarbeariaName(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL Personalizada</Label>
                  <Input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} className="bg-white/5 border-none h-12 font-mono text-sm" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CEP</Label>
                  <div className="relative">
                    <Input placeholder="00000-000" maxLength={9} value={zipCode} onChange={handleCepChange} className="bg-white/5 border-none h-12 font-mono" />
                    {isFetchingCep && <Search className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary" />}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rua / Avenida</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número</Label>
                  <Input ref={numberInputRef} value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Complemento</Label>
                  <Input value={complement} onChange={(e) => setComplement(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bairro</Label>
                  <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cidade</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">UF</Label>
                  <Input maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className="bg-white/5 border-none h-12 uppercase text-center" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary"><ShieldCheck className="w-5 h-5"/> Documentação</h3>
                <Input placeholder="000.000.000-00" value={document} onChange={(e) => setDocument(formatDocument(e.target.value))} className="h-14 text-lg font-mono bg-white/5 border-none" />
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5">
                <h3 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary"><Clock className="w-5 h-5"/> Horário Padrão</h3>
                <div className="flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-sm font-semibold">Seg a Sex, 09h às 18h?</p>
                  <Checkbox checked={useDefaultHours} onCheckedChange={(c) => setUseDefaultHours(c === true)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary"><Scissors className="w-5 h-5"/> Serviço Principal</h3>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Serviço</Label>
                    <Input value={mainServiceName} onChange={(e) => setMainServiceName(e.target.value)} className="h-12 bg-white/5 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preço (R$)</Label>
                    <Input inputMode="decimal" value={mainServicePrice} onChange={(e) => setMainServicePrice(e.target.value)} className="h-12 bg-white/5 border-none font-mono" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-10 pt-6 border-t border-white/5">
            {step > 1 && (
              <Button variant="outline" className="h-14 flex-1 uppercase tracking-widest text-xs font-bold border-white/10 hover:bg-white/5" onClick={prevStep} disabled={isSubmitting}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            )}
            {step < totalSteps ? (
              <Button className="h-14 flex-1 uppercase tracking-widest text-xs font-black" onClick={nextStep}>
                Próximo <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button className="h-14 flex-1 uppercase tracking-widest text-xs font-black shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Sincronizando..." : "Finalizar Setup"}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}