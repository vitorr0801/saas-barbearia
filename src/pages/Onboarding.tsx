import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// 🚀 INJEÇÃO: Adicionamos ImagePlus e UploadCloud nesta linha abaixo
import { Search, ShieldCheck, Clock, Scissors, ChevronRight, ChevronLeft, ImagePlus, UploadCloud } from "lucide-react";
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

function formatWhatsApp(value: string) {
  let v = value.replace(/\D/g, ""); // Remove tudo que não é número
  if (v.length > 11) v = v.slice(0, 11); // Trava em 11 dígitos
  if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 9) v = `${v.slice(0, 10)}-${v.slice(10)}`;
  return v;
}

function formatDocument(value: string) {
  const nums = value.replace(/\D/g, "");
  if (nums.length <= 11) {
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").slice(0, 18);
}

// 🚀 COLOU AQUI: Algoritmo Oficial de Validação de CPF (Módulo 11)
function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; 
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}

// 🚀 E AQUI: Algoritmo Oficial de Validação de CNPJ (Módulo 11)
function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0, pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
}

// 🚀 UTILITÁRIO FINANCEIRO: Máscara BRL em Tempo Real
function formatCurrency(value: string) {
  let v = value.replace(/\D/g, ""); // Arranca tudo que não for número
  if (v === "") return "";
  // Converte para decimal (dividindo por 100)
  v = (parseInt(v, 10) / 100).toFixed(2) + "";
  // Troca ponto por vírgula e aplica os pontos de milhar
  v = v.replace(".", ",");
  v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
  v = v.replace(/(\d)(\d{3}),/g, "$1.$2,");
  return v;
}

// --- SCHEMAS DE VALIDAÇÃO (Atualizados para tolerar o S/N e Anti-Fraude) ---
const step1Schema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia."),
  whatsapp: z.string().trim().min(14, "Informe um WhatsApp válido.").max(15, "WhatsApp inválido."),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido.").min(3).max(50),
  zip_code: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido."),
  street: z.string().trim().min(2, "Rua é obrigatória."),
  address_number: z.string().trim().min(1, "Número é obrigatório."),
  neighborhood: z.string().trim().min(2, "Bairro é obrigatório."),
  city: z.string().trim().min(2, "Cidade é obrigatória."),
  state: z.string().length(2, "UF deve ter 2 letras."),
});

const step2Schema = z.object({
  document: z.string().trim().refine((val) => {
    // Limpa a máscara para analisar apenas os números puros
    const cleanVal = val.replace(/\D/g, "");
    
    // Roteamento inteligente: Decide se usa a trava de CPF ou CNPJ
    if (cleanVal.length === 11) return isValidCPF(cleanVal);
    if (cleanVal.length === 14) return isValidCNPJ(cleanVal);
    
    // Se não tiver nem 11 nem 14 números, já barra imediatamente
    return false; 
  }, "Documento inválido. O CPF ou CNPJ digitado não é válido."),
});

const step3Schema = z.object({
  mainServiceName: z.string().trim().min(2, "Informe o nome.").max(50, "O limite é de 50 caracteres."),
  mainServicePrice: z.string().trim().min(4, "Informe um preço válido (ex: 45,00)."),
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
  const [whatsapp, setWhatsapp] = useState("");
  
  // 🚀 ESTADOS DO UPLOAD DE IMAGEM
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);

  // 🚀 OTIMIZAÇÃO DE RECURSOS: Prevenção de Memory Leak (Vazamento de Memória)
  useEffect(() => {
    // Quando o usuário fechar a página ou o componente for destruído, o React limpa a RAM
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  // 🚀 FUNÇÃO QUE PROCESSA A IMAGEM E GERA O PREVIEW
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // OTIMIZAÇÃO: Se o usuário já tinha escolhido uma foto antes, remove a velha da memória
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      
      setCoverFile(file); // Guarda para mandar pro banco
      setCoverPreviewUrl(URL.createObjectURL(file)); // Gera a visualização ultra-rápida
    }
  };

  // 🚀 ESTADO: Controle da trava do endereço sem número
  const [semNumero, setSemNumero] = useState(false);

  const [document, setDocument] = useState("");
  const [useDefaultHours, setUseDefaultHours] = useState(true);

  const [mainServiceName, setMainServiceName] = useState("Corte Clássico");
  const [mainServicePrice, setMainServicePrice] = useState("00,00");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // 🚀 Tratamento invisível do S/N antes de validar
      const finalNumber = semNumero ? "S/N" : addressNumber;
      
      // 🔌 Padrão Mundial: Plugando o WhatsApp no pipeline de validação
      const parsed = step1Schema.safeParse({ 
        name: barbeariaName, 
        whatsapp: whatsapp, // 👈 A CORREÇÃO ESTÁ AQUI
        slug, 
        zip_code: zipCode, 
        street, 
        address_number: finalNumber, 
        neighborhood, 
        city, 
        state 
      });
      
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
        `${streetStr}, ${numStr}, ${neighStr}, ${cityStr}, ${stateStr}, Brasil`, 
        `${streetStr}, ${cityStr}, ${stateStr}, Brasil`, 
        `${neighStr}, ${cityStr}, ${stateStr}, Brasil`,  
        `${cityStr}, ${stateStr}, Brasil`                
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

      // 1. Upload da Imagem (Isso continua no Front-end pois interage com o Storage)
      let coverUrl = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `cover_${user.id}_${Date.now()}.${ext}`;
        await supabase.storage.from("barbershop-assets").upload(fileName, coverFile);
        const { data: pub } = supabase.storage.from("barbershop-assets").getPublicUrl(fileName);
        coverUrl = pub?.publicUrl;
      }

      // Resolve coordenadas e endereço
      const finalNumber = semNumero ? "S/N" : addressNumber;
      const coords = await fetchIntelligentCoordinates(street, finalNumber, neighborhood, city, state);

      // 🚀 A CHAMADA "NÍVEL DEUS" (RPC Transacional)
      const { data, error } = await supabase.rpc('finalizar_setup_barbearia', {
        p_owner_id: user.id,
        p_name: barbeariaName,
        p_whatsapp: whatsapp.replace(/\D/g, ""),
        p_slug: slug,
        p_zip_code: zipCode,
        p_street: street,
        p_address_number: finalNumber,
        p_complement: complement || null,
        p_neighborhood: neighborhood,
        p_city: city,
        p_state: state,
        p_lng: coords ? coords.lng : null,
        p_lat: coords ? coords.lat : null,
        p_cover_image: coverUrl,
        p_document: document.replace(/\D/g, ""),
        p_main_service_name: mainServiceName,
        p_main_service_price: parseFloat(mainServicePrice.replace(",", ".")),
        p_use_default_hours: useDefaultHours
      });

      // Se o banco desfez a transação (ex: slug duplicado), ele cospe o erro aqui
      if (error) throw new Error(error.message);

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
          {/* 🚀 TÍTULO ALINHADO COM A EXPECTATIVA COGNITIVA */}
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground mb-4">
            {step === 1 && <span className="text-white">Passo 1: <span className="text-primary">Perfil & Localização</span></span>}
            {step === 2 && <span className="text-white">Passo 2: <span className="text-primary">Operação & Legal</span></span>}
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
              
              {/* LINHA 1: IDENTIDADE E CONTATO */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-2 md:col-span-7">
                  {/* 🚀 Evoluímos para text-xs (12px) */}
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    Nome da Barbearia <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <Input placeholder="Barbearia Elite" value={barbeariaName} onChange={(e) => setBarbeariaName(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
                
                {/* 🚀 O Novo Motor de Vendas: WhatsApp */}
                <div className="space-y-2 md:col-span-5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    WhatsApp <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <Input placeholder="(00) 00000-0000" inputMode="numeric" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))} className="bg-white/5 border-none h-12 font-mono text-xs" />
                </div>
              </div>

              {/* 🚀 LINHA 1.5: URL DE ELITE (Com prefixo visual) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                  URL Personalizada <span className="text-red-500 text-sm ml-0.5">*</span>
                </Label>
                <div className="flex items-center h-12 bg-white/5 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-all">
                  <span className="px-3 text-muted-foreground/60 font-mono text-xs bg-black/20 h-full flex items-center border-r border-white/5">
                    barberpro.com/
                  </span>
                  <Input 
                    value={slug} 
                    onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} 
                    className="bg-transparent border-none h-full font-mono text-xs flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-3" 
                    placeholder="sua-barbearia"
                  />
                </div>
              </div>

              {/* LINHA 2: LOCALIZAÇÃO (CEP + RUA) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-2 md:col-span-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    CEP <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <div className="relative">
                    <Input placeholder="00000-000" maxLength={9} value={zipCode} onChange={handleCepChange} className="bg-white/5 border-none h-12 font-mono" />
                    {isFetchingCep && <Search className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary" />}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-8">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    Rua / Avenida <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
              </div>

              {/* LINHA 3: A ENGENHARIA DE 12 COLUNAS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    Número {!semNumero && <span className="text-red-500 text-sm ml-0.5">*</span>}
                  </Label>
                  <Input 
                    ref={numberInputRef} 
                    value={semNumero ? "" : addressNumber} 
                    onChange={(e) => setAddressNumber(e.target.value)} 
                    placeholder={semNumero ? "S/N" : "Ex: 123"}
                    disabled={semNumero}
                    className={cn("h-12 transition-all", semNumero ? "opacity-50 cursor-not-allowed bg-white/5 border-none text-muted-foreground" : "bg-white/5 border-none")}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                    Complemento
                    {/* 🚀 Evoluímos o opcional para text-[10px] com opacidade ajustada */}
                    <span className="text-[10px] font-medium text-muted-foreground/60 lowercase tracking-normal">
                      (Opcional)
                    </span>
                  </Label>
                  <Input maxLength={50} value={complement} onChange={(e) => setComplement(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
                
                <div className="space-y-2 md:col-span-5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    Bairro <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
              </div>

              {/* CHECKBOX SEM NÚMERO */}
              <div className="flex items-center space-x-2 pt-1 pb-2">
                <Checkbox 
                  id="sem-numero" 
                  checked={semNumero}
                  onCheckedChange={(checked) => setSemNumero(checked === true)}
                  className="w-4 h-4 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <label 
                  htmlFor="sem-numero" 
                  // 🚀 Evoluímos o texto do checkbox para text-xs também
                  className="text-xs font-bold text-muted-foreground cursor-pointer hover:text-white transition-colors uppercase tracking-widest"
                >
                  Endereço sem número
                </label>
              </div>

              {/* LINHA 4: FINALIZAÇÃO (CIDADE + UF) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-2 md:col-span-9">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    Cidade <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="bg-white/5 border-none h-12" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start">
                    UF <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <Input maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className="bg-white/5 border-none h-12 uppercase text-center" />
                </div>
              </div>
            </div>
          )}

{step === 2 && (
            <div className="space-y-8 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* BLOCO 1: DOCUMENTAÇÃO (Com Micro-copy e Consistência) */}
              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary mb-1">
                    <ShieldCheck className="w-5 h-5"/> Documentação Legal
                  </h3>
                  {/* Alívio cognitivo do porquê estamos pedindo isso */}
                  <p className="text-[11px] font-medium text-muted-foreground/70">
                    Necessário para a verificação de segurança da sua conta e repasses financeiros.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    CPF ou CNPJ <span className="text-red-500 text-sm ml-0.5">*</span>
                  </Label>
                  <Input 
                    placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                    value={document} 
                    onChange={(e) => setDocument(formatDocument(e.target.value))} 
                    className="h-12 bg-white/5 border-none font-mono text-sm" 
                  />
                </div>
              </div>

              {/* BLOCO 2: HORÁRIO (Com Gatilho de Avanço Rápido) */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary mb-1">
                    <Clock className="w-5 h-5"/> Operação Inicial
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground/70">
                    Vamos configurar um horário base para você já começar a receber agendamentos.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 p-5 rounded-2xl border border-white/10 bg-white/5 transition-all hover:bg-white/[0.07]">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setUseDefaultHours(!useDefaultHours)}>
                    <Label htmlFor="default-hours" className="text-sm font-bold cursor-pointer">
                      Atender de Segunda a Sexta, das 09h às 18h?
                    </Label>
                    <Checkbox 
                      id="default-hours" 
                      checked={useDefaultHours} 
                      onCheckedChange={(c) => setUseDefaultHours(c === true)} 
                      className="w-5 h-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" 
                    />
                  </div>
                  {/* O texto que salva a conversão e evita paralisia */}
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Fique tranquilo! Você poderá personalizar horários, sábados e pausas para almoço no painel após finalizar o setup.
                  </p>
                </div>
              </div>

            </div>
          )}

{step === 3 && (
            <div className="space-y-8 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* BLOCO 1: SERVIÇO */}
              <div className="space-y-4">
                
                {/* 🚀 Cabeçalho com Alívio Cognitivo */}
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary mb-1">
                    <Scissors className="w-5 h-5"/> Serviço Principal
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground/70">
                    Cadastre o seu serviço mais popular para ativar a sua vitrine online. Você poderá adicionar todo o seu cardápio depois.
                  </p>
                </div>

                {/* 🚀 O Grid Apertado: 3/4 (Nome) e 1/4 (Preço) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  
                  <div className="space-y-2 md:col-span-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                      <span>Nome do Serviço <span className="text-red-500 text-sm ml-0.5">*</span></span>
                      {/* Pequeno contador visual para guiar o usuário */}
                      <span className="text-[10px] font-normal text-muted-foreground/50">{mainServiceName.length}/50</span>
                    </Label>
                    {/* Trava física de 50 caracteres no front-end */}
                    <Input 
                      maxLength={50} 
                      value={mainServiceName} 
                      onChange={(e) => setMainServiceName(e.target.value)} 
                      className="h-12 bg-white/5 border-none" 
                      placeholder="Ex: Corte Clássico"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                      Preço <span className="text-red-500 text-sm ml-0.5">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                        R$
                      </span>
                      {/* Trava de 8 caracteres (Ex: 9.999,99) e injeção da máscara */}
                      <Input 
                        inputMode="numeric" 
                        maxLength={8}
                        value={mainServicePrice} 
                        onChange={(e) => setMainServicePrice(formatCurrency(e.target.value))} 
                        className="h-12 bg-white/5 border-none font-mono pl-8" 
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  
                </div>

              </div>

              {/* 🚀 BLOCO 2: UPLOAD DE IMAGEM (Padrão Mundial UI/UX) */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary mb-1">
                    <ImagePlus className="w-5 h-5"/> Fachada da Barbearia
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground/70">
                    Uma boa foto atrai mais clientes. <span className="text-primary font-bold">Totalmente opcional</span>, adicione depois no painel se preferir.
                  </p>
                </div>
                
                <Label 
                  htmlFor="cover-upload" 
                  className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/20 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden group"
                >
                  {coverPreviewUrl ? (
                    <>
                      {/* Preview da Imagem Otimizada */}
                      <img src={coverPreviewUrl} alt="Preview da Fachada" className="w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-sm">Trocar Imagem</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground group-hover:text-white transition-colors">
                      <div className="p-3 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest">Clique para selecionar</p>
                        <p className="text-[10px] font-medium opacity-50">PNG, JPG ou WEBP (Max. 5MB)</p>
                      </div>
                    </div>
                  )}
                  {/* Trava de Segurança B2B: Aceita apenas imagens */}
                  <input 
                    id="cover-upload" 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                    onChange={handleCoverChange} 
                  />
                </Label>
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