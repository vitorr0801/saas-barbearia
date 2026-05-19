"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Plus, Trash2, Pencil, Scissors, Clock, Tag, Info
} from "lucide-react";
import {
  createMasterServiceClient,
  deleteMasterServiceClient,
  listMasterServices,
  type MasterService,
  updateMasterServiceClient,
} from "@/lib/services-client";
import { formatDuration } from "@/lib/formatDuration";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = [
  { id: 0, label: "Dom" }, { id: 1, label: "Seg" }, { id: 2, label: "Ter" },
  { id: 3, label: "Qua" }, { id: 4, label: "Qui" }, { id: 5, label: "Sex" }, { id: 6, label: "Sáb" }
];

// Máscara Dinâmica de Moeda (BRL) - Max: 9.999,99
const formatCurrencyInput = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";
  
  if (digits.length > 6) {
    digits = digits.slice(0, 6);
  }
  
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function Servicos() {
  const [services, setServices] = useState<MasterService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  
  // Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [svcSaving, setSvcSaving] = useState(false);

  // Form State
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [svcDescription, setSvcDescription] = useState("");
  const [svcPromoPercentage, setSvcPromoPercentage] = useState("0");
  const [svcPromoDays, setSvcPromoDays] = useState<number[]>([]);

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const { services: svc, error } = await listMasterServices();
      if (error) throw new Error(error);
      setServices(svc || []);
    } catch (e: unknown) {
      toast.error("Falha ao carregar o catálogo de serviços.");
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const openCreateService = () => {
    setEditingService(null); 
    setSvcName(""); 
    setSvcPrice(""); 
    setSvcDuration(""); 
    setSvcDescription("");
    setSvcPromoPercentage("0"); 
    setSvcPromoDays([]); 
    setServiceModalOpen(true);
  };

  const openEditService = (s: any) => {
    setEditingService(s); 
    setSvcName(s.name); 
    setSvcPrice(Number(s.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); 
    setSvcDuration(String(s.duration_min)); 
    setSvcDescription(s.description || ""); 
    setSvcPromoPercentage(String(s.promo_percentage || 0));
    setSvcPromoDays(s.promo_days || []);
    setServiceModalOpen(true);
  };

  const togglePromoDay = (dayId: number) => {
    setSvcPromoDays(prev => prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]);
  };

  const saveService = async () => {
    const name = svcName.trim();
    const numericPrice = Number(svcPrice.replace(/\./g, "").replace(",", "."));
    const durationMin = Number(String(svcDuration).replace(",", "."));
    const promoPercentage = Number(svcPromoPercentage);
    
    if (!name || numericPrice <= 0 || durationMin <= 0) return toast.error("Preencha os campos obrigatórios corretamente.");

    setSvcSaving(true);
    const toastId = toast.loading(editingService ? "Atualizando..." : "Criando...");
    
    try {
      const payload = {
        name, 
        price: numericPrice, 
        duration_min: durationMin,
        description: svcDescription.trim(), 
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
      
      await loadServices();
      toast.success("Serviço salvo com sucesso!", { id: toastId });
      setServiceModalOpen(false);
    } catch (e: unknown) {
      toast.error("Erro ao salvar serviço.", { id: toastId });
    } finally {
      setSvcSaving(false);
    }
  };

  const deleteService = async (s: MasterService) => {
    const toastId = toast.loading("Excluindo serviço...");
    try {
      const { error } = await deleteMasterServiceClient(s.id);
      if (error) throw new Error(error);
      await loadServices();
      toast.success("Excluído com sucesso.", { id: toastId });
    } catch (e: unknown) {
      toast.error("Erro ao excluir.", { id: toastId });
    }
  };

  return (
    <div className="container max-w-7xl mx-auto space-y-8 overflow-x-hidden">
      
      {/* 🏁 EXECUTIVE HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Scissors className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catálogo Global</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Meus <span className="text-primary">Serviços</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Gerencie seu catálogo de serviços e defina os valores base.
          </p>
        </div>
        
        <Button onClick={openCreateService} className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 shrink-0 transition-transform active:scale-95">
          <Plus className="h-5 w-5 mr-2" /> Novo Serviço
        </Button>
      </header>

      {/* 📦 GRID DE CATÁLOGO */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        {servicesLoading ? (
          <div className="py-24 flex justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : services.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-border/60 bg-card/20 p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center">
              <Scissors className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-foreground">Catálogo Vazio</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1 max-w-md mx-auto">
                Você ainda não tem nenhum serviço cadastrado. Clique no botão acima para adicionar o primeiro serviço.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((s: any) => {
              const promoPerc = Number(s.promo_percentage) || 0;
              const hasPromo = promoPerc > 0;
              const promoDaysText = hasPromo && Array.isArray(s.promo_days) ? s.promo_days.map((d: number) => DIAS_SEMANA[d].label).join(", ") : "";

              return (
                <div key={s.id} className="group rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl hover:bg-card/50 hover:border-primary/30 transition-all p-6 flex flex-col justify-between gap-6 shadow-sm">
                  
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{s.name}</h3>
                      <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditService(s)} className="p-2 rounded-xl bg-secondary hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => void deleteService(s)} className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground break-words min-h-[2rem]">
                      {s.description || <span className="italic opacity-50">Nenhuma descrição informada.</span>}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{formatDuration(s.duration_min)}</span>
                      </div>
                      <span className="text-xl font-black text-primary tabular-nums">R$ {Number(s.price).toFixed(2).replace(".", ",")}</span>
                    </div>

                    {hasPromo && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase px-3 py-1.5 w-fit">
                        {promoPerc}% OFF em dias específicos ({promoDaysText})
                      </Badge>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 🚀 MODAL DE CADASTRO COM LIMITES BLINDADOS */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl border border-border bg-[#0a0c12] shadow-2xl p-6 sm:p-8 overflow-visible">
          <DialogHeader className="mb-6 text-left">
            <DialogTitle className="font-black uppercase italic tracking-tighter text-2xl text-foreground flex items-center gap-3">
              {editingService ? "Editar Serviço" : "Criar Serviço Master"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Nome do Serviço</Label>
                <Input 
                  value={svcName} 
                  onChange={(e) => setSvcName(e.target.value)} 
                  maxLength={50} // 🚀 Limite de 50 caracteres inserido
                  className="h-12 rounded-xl bg-secondary/30 border-border/50 font-bold" 
                  disabled={svcSaving} 
                  placeholder="Ex: Corte Degrade" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Preço Padrão (R$)</Label>
                  <div className="group relative flex items-center">
                    <Info className="w-3 h-3 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-[#1a1d27] border border-white/10 text-[10px] font-medium text-white/90 rounded-xl shadow-2xl z-50 text-center pointer-events-none">
                      Este é o valor base do catálogo. Você pode cobrar preços diferentes para cada profissional na aba "Equipe".
                    </div>
                  </div>
                </div>
                <Input 
                  inputMode="numeric" 
                  value={svcPrice} 
                  onChange={(e) => setSvcPrice(formatCurrencyInput(e.target.value))} 
                  className="h-12 rounded-xl bg-secondary/30 border-border/50 font-mono font-bold text-primary" 
                  disabled={svcSaving} 
                  placeholder="0,00" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Duração (Minutos)</Label>
                  <div className="group relative flex items-center">
                    <Info className="w-3 h-3 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-[#1a1d27] border border-white/10 text-[10px] font-medium text-white/90 rounded-xl shadow-2xl z-50 text-center pointer-events-none">
                      O tempo médio deste serviço. Fundamental para o sistema encaixar clientes na agenda automaticamente.
                    </div>
                  </div>
                </div>
                <Input 
                  inputMode="numeric" 
                  value={svcDuration} 
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 3) val = val.slice(0, 3); // 🚀 Limite de 3 dígitos inserido (Máx 999)
                    setSvcDuration(val);
                  }} 
                  className="h-12 rounded-xl bg-secondary/30 border-border/50 font-mono font-bold" 
                  disabled={svcSaving} 
                  placeholder="45" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Descrição de Vendas</Label>
                <div className="group relative flex items-center">
                  <Info className="w-3 h-3 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-[#1a1d27] border border-white/10 text-[10px] font-medium text-white/90 rounded-xl shadow-2xl z-50 text-center pointer-events-none">
                    Destaque os diferenciais (ex: inclui toalha quente, finalização com pomada). O cliente verá isso no aplicativo.
                  </div>
                </div>
              </div>
              <div className="relative">
                <textarea 
                  value={svcDescription}
                  onChange={(e) => setSvcDescription(e.target.value)}
                  maxLength={200}
                  className="flex w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none font-medium leading-relaxed"
                  placeholder="Descreva os diferenciais deste serviço para o seu cliente..."
                  disabled={svcSaving}
                />
                <span className={cn(
                  "absolute bottom-3 right-4 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm transition-colors",
                  svcDescription.length >= 200 ? "text-destructive bg-destructive/20" : "text-muted-foreground bg-secondary/80"
                )}>
                  {svcDescription.length}/200
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Tag className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Promoção Dinâmica</span>
                <div className="group relative flex items-center">
                  <Info className="w-3 h-3 text-emerald-500/60 hover:text-emerald-500 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2.5 bg-[#1a1d27] border border-emerald-500/20 text-[10px] font-medium text-emerald-100 rounded-xl shadow-2xl z-50 text-center pointer-events-none">
                    Use para dias com pouco movimento. O desconto é aplicado no checkout automaticamente nos dias selecionados.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-500/70">OFF (%)</Label>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    value={svcPromoPercentage} 
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (Number(val) > 100) val = "100";
                      setSvcPromoPercentage(val);
                    }} 
                    className="h-10 rounded-xl bg-background border-emerald-500/20 text-emerald-500 font-black focus-visible:ring-emerald-500" 
                    placeholder="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-500/70">Aplicar nos Dias</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DIAS_SEMANA.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => togglePromoDay(day.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border shrink-0",
                          svcPromoDays.includes(day.id) 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
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

          </div>

          <div className="mt-8 pt-6 border-t border-border flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest border-border/50" onClick={() => setServiceModalOpen(false)} disabled={svcSaving}>Cancelar</Button>
            <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={() => void saveService()} disabled={svcSaving}>
              {svcSaving ? "Salvando..." : "Salvar no Catálogo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}