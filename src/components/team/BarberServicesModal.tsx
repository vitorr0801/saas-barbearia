import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Scissors, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useBarberServices, type BarberServiceData } from "@/hooks/useBarberServices";

interface BarberServicesModalProps {
  barberId: string | null;
  barberName: string;
  barbeariaId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarberServicesModal({ barberId, barberName, barbeariaId, open, onOpenChange }: BarberServicesModalProps) {
  const { data, isLoading, updateServices } = useBarberServices(barbeariaId, barberId || undefined);
  const [localServices, setLocalServices] = useState<BarberServiceData[]>([]);

  // Carrega os dados do banco para o estado local quando o modal abre
  useEffect(() => {
    if (data) setLocalServices(data);
  }, [data, open]);

  const handleToggle = (serviceId: string, isActive: boolean) => {
    setLocalServices(prev => prev.map(s => s.service_id === serviceId ? { ...s, is_active: isActive } : s));
  };

  const handleCustomPrice = (serviceId: string, value: string) => {
    const num = parseFloat(value);
    setLocalServices(prev => prev.map(s => 
      s.service_id === serviceId ? { ...s, custom_price: isNaN(num) ? null : num } : s
    ));
  };

  const handleSave = async () => {
    if (!barberId) return;
    const toastId = toast.loading(`Salvando serviços de ${barberName}...`);
    try {
      await updateServices.mutateAsync({ barberId, services: localServices });
      toast.success("Serviços atualizados com sucesso!", { id: toastId });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar serviços.", { id: toastId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-background border-border max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Scissors className="h-5 w-5 text-primary" />
            Serviços de {barberName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ative os serviços que este profissional realiza. Deixe o preço em branco para cobrar o valor padrão da barbearia.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : localServices.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Nenhum serviço master cadastrado na barbearia.</p>
          ) : (
            localServices.map((svc) => (
              <div key={svc.service_id} className={`p-4 rounded-xl border transition-colors ${svc.is_active ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm font-bold text-foreground">{svc.name}</Label>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Padrão: R$ {svc.master_price.toFixed(2)} • {svc.master_duration} min
                    </p>
                  </div>
                  <Switch checked={svc.is_active} onCheckedChange={(val) => handleToggle(svc.service_id, val)} />
                </div>

                {svc.is_active && (
                  <div className="flex gap-3 pt-3 border-t border-border/50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase">Preço Específico (R$)</Label>
                      <Input 
                        type="number" 
                        placeholder={`Padrão: ${svc.master_price}`}
                        value={svc.custom_price || ""}
                        onChange={(e) => handleCustomPrice(svc.service_id, e.target.value)}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 opacity-50 pointer-events-none">
                       {/* Opcional: Futuramente você pode habilitar edição de tempo também */}
                      <Label className="text-[10px] text-muted-foreground uppercase">Tempo (Min)</Label>
                      <Input type="number" placeholder={`${svc.master_duration}`} readOnly className="h-8 text-xs bg-background" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateServices.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {updateServices.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Regras
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}