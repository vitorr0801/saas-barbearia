import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DelayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextClientName?: string;
}

export function DelayModal({ open, onOpenChange, nextClientName }: DelayModalProps) {
  const handleDelay = (minutes: number) => {
    toast.success(`Atraso de ${minutes} minutos registrado`, {
      description: nextClientName 
        ? `${nextClientName} será notificado automaticamente.`
        : "Próximo cliente será notificado.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            Informar Atraso
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-6">
            Selecione o tempo de atraso. O próximo cliente receberá uma 
            notificação automática via WhatsApp.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[5, 10, 15].map((minutes) => (
              <Button
                key={minutes}
                variant="outline"
                onClick={() => handleDelay(minutes)}
                className="h-20 flex flex-col gap-1 border-border hover:border-primary hover:bg-primary/10 transition-all"
              >
                <span className="text-2xl font-bold text-foreground">+{minutes}</span>
                <span className="text-xs text-muted-foreground">minutos</span>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
