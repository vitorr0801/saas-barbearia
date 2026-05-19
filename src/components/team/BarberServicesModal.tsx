"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Scissors, Loader2, Save, Info, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { listMasterServices } from "@/lib/services-client"; 

type BarberServiceData = {
  service_id: string;
  name: string;
  master_price: number;
  master_duration: number;
  is_active: boolean;
  custom_price: number | null;
  custom_price_str: string;
};

interface BarberServicesModalProps {
  barberId: string | null;
  barberName: string;
  barbeariaId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarberServicesModal({ barberId, barberName, barbeariaId, open, onOpenChange }: BarberServicesModalProps) {
  const [localServices, setLocalServices] = useState<BarberServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!barberId) return;
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const { services: master, error: masterErr } = await listMasterServices();
      if (masterErr) throw new Error(`Falha na API: ${masterErr}`);
      
      if (!master || master.length === 0) {
        setLocalServices([]);
        setIsLoading(false);
        return;
      }

      const { data: links, error: linkErr } = await supabase
        .from("barber_services")
        .select("service_id, is_active, custom_price")
        .eq("professional_id", barberId);
        
      if (linkErr) throw new Error(`Falha no Banco: ${linkErr.message}`);

      const merged = master.map(m => {
        const l = links?.find(x => String(x.service_id) === String(m.id));
        const numPrice = l?.custom_price ? Number(l.custom_price) : null;
        
        const strPrice = numPrice !== null 
          ? numPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "";

        return {
          service_id: m.id,
          name: m.name,
          master_price: Number(m.price),
          master_duration: Number(m.duration_min),
          is_active: !!l?.is_active,
          custom_price: numPrice,
          custom_price_str: strPrice,
        };
      });

      setLocalServices(merged);
    } catch (e: any) {
      console.error("[BarberServicesModal] Erro Crítico:", e);
      setErrorMsg(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [barberId]);

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      setLocalServices([]);
      setErrorMsg(null);
    }
  }, [open, loadData]);

  const handleToggle = (serviceId: string, isActive: boolean) => {
    setLocalServices(prev => prev.map(s => s.service_id === serviceId ? { ...s, is_active: isActive } : s));
  };

  const handleCustomPrice = (serviceId: string, value: string) => {
    let digits = value.replace(/\D/g, ""); 
    
    if (!digits) {
      setLocalServices(prev => prev.map(s => 
        s.service_id === serviceId ? { ...s, custom_price: null, custom_price_str: "" } : s
      ));
      return;
    }

    if (digits.length > 6) {
      digits = digits.slice(0, 6);
    }
    
    const num = parseInt(digits, 10) / 100;
    const formatted = num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setLocalServices(prev => prev.map(s => 
      s.service_id === serviceId ? { ...s, custom_price: num, custom_price_str: formatted } : s
    ));
  };

  const handleSave = async () => {
    // 🚀 TIER-1: Proteção dupla. Se não houver ID da barbearia, nem tenta salvar!
    if (!barberId || !barbeariaId) {
      toast.error("Erro crítico: ID da Barbearia não encontrado.");
      return;
    }
    
    setIsSaving(true);
    const toastId = toast.loading(`Salvando catálogo de ${barberName}...`);
    
    try {
      const payload = localServices.map(s => ({
        barbearia_id: barbeariaId, // 🚀 O CRACHÁ OBRIGATÓRIO ESTÁ AQUI AGORA!
        professional_id: barberId,
        service_id: s.service_id,
        is_active: s.is_active,
        custom_price: s.custom_price
      }));

      const { error } = await supabase
        .from("barber_services")
        .upsert(payload, { onConflict: "professional_id,service_id" });
        
      if (error) throw new Error(error.message);
      
      toast.success("Serviços atualizados com sucesso!", { id: toastId });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar serviços.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#0a0c12] border-border shadow-2xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden">
        <DialogHeader className="px-2 pt-2 flex flex-row items-start justify-between">
          <div>
            <DialogTitle className="flex items-center gap-3 font-black uppercase italic tracking-tighter text-2xl text-foreground">
              <Scissors className="h-6 w-6 text-primary" />
              Serviços: <span className="text-primary">{barberName}</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium text-xs mt-1">
              Ative os serviços que este profissional realiza. Deixe o preço em branco para herdar o valor global.
            </DialogDescription>
          </div>
          
          <button 
            onClick={loadData} 
            disabled={isLoading}
            className="p-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 mt-1"
            title="Atualizar Forçadamente"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Extraindo Dados...</p>
            </div>
          ) : errorMsg ? (
            <div className="text-center py-8 border border-destructive/30 rounded-2xl bg-destructive/10">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">Ocorreu um Erro</p>
              <p className="text-xs text-muted-foreground mt-1 px-4">{errorMsg}</p>
            </div>
          ) : localServices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-secondary/10">
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">Catálogo Vazio</p>
              <p className="text-xs text-muted-foreground mt-1">Crie serviços na aba "Catálogo &gt; Serviços" primeiro.</p>
            </div>
          ) : (
            localServices.map((svc) => (
              <div key={svc.service_id} className={`p-5 rounded-2xl border transition-all duration-300 ${svc.is_active ? 'border-primary/40 bg-primary/5 shadow-md shadow-primary/5' : 'border-border/60 bg-secondary/20 hover:bg-secondary/40'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-base font-black text-foreground uppercase tracking-tight">{svc.name}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        Catálogo: R$ {svc.master_price.toFixed(2)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {svc.master_duration} Min
                      </span>
                    </div>
                  </div>
                  <Switch checked={svc.is_active} onCheckedChange={(val) => handleToggle(svc.service_id, val)} className="data-[state=checked]:bg-primary" />
                </div>

                {svc.is_active && (
                  <div className="flex gap-4 pt-4 mt-2 border-t border-border/50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Preço Específico (R$)</Label>
                        <div className="group relative flex items-center">
                          <Info className="w-3 h-3 text-primary/60 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-[#1a1d27] border border-white/10 text-[10px] text-white/90 rounded-lg shadow-2xl z-50 text-center pointer-events-none">
                            Se este barbeiro cobrar mais caro ou mais barato, digite aqui. Se for igual, deixe em branco.
                          </div>
                        </div>
                      </div>
                      
                      <Input 
                        type="text" 
                        inputMode="numeric"
                        placeholder={`Padrão: ${svc.master_price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        value={svc.custom_price_str}
                        onChange={(e) => handleCustomPrice(svc.service_id, e.target.value)}
                        className="h-10 text-sm font-bold bg-background/50 border-border/50 focus-visible:ring-primary text-primary"
                      />

                    </div>
                    <div className="flex-1 space-y-2 opacity-50 pointer-events-none">
                      <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Tempo Fixo</Label>
                      <Input type="text" placeholder={`${svc.master_duration} Minutos`} readOnly className="h-10 text-sm font-bold bg-background/30 border-transparent" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-3 px-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs font-bold uppercase tracking-widest border-border/50 h-12 px-6">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 h-12 px-8">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}