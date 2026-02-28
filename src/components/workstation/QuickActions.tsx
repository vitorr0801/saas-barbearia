import { Clock, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onDelayClick: () => void;
  onCallNextClick: () => void;
  onMessageClick: () => void;
  hasCurrentAppointment: boolean;
  currentClientPhone?: string;
}

export function QuickActions({
  onDelayClick,
  onCallNextClick,
  onMessageClick,
  hasCurrentAppointment,
  currentClientPhone,
}: QuickActionsProps) {
  const handleMessage = () => {
    if (currentClientPhone) {
      window.open(
        `https://wa.me/55${currentClientPhone.replace(/\D/g, '')}`,
        '_blank'
      );
    }
    onMessageClick();
  };

  return (
    <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-3">
        {/* Delay Button */}
        <Button
          variant="outline"
          onClick={onDelayClick}
          disabled={!hasCurrentAppointment}
          className={cn(
            "h-16 flex flex-col gap-1 border-border rounded-xl transition-all",
            hasCurrentAppointment && "hover:border-primary hover:bg-primary/10"
          )}
        >
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium">Vou Atrasar</span>
        </Button>

        {/* Call Next Button */}
        <Button
          variant="outline"
          onClick={onCallNextClick}
          disabled={hasCurrentAppointment}
          className={cn(
            "h-16 flex flex-col gap-1 border-border rounded-xl transition-all",
            !hasCurrentAppointment && "hover:border-success hover:bg-success/10"
          )}
        >
          <UserPlus className={cn(
            "w-5 h-5",
            hasCurrentAppointment ? "text-muted-foreground" : "text-success"
          )} />
          <span className="text-xs font-medium">Chamar Próximo</span>
        </Button>

        {/* Message Button */}
        <Button
          variant="outline"
          onClick={handleMessage}
          disabled={!hasCurrentAppointment}
          className={cn(
            "h-16 flex flex-col gap-1 border-border rounded-xl transition-all",
            hasCurrentAppointment && "hover:border-success hover:bg-success/10"
          )}
        >
          <MessageCircle className={cn(
            "w-5 h-5",
            hasCurrentAppointment ? "text-success" : "text-muted-foreground"
          )} />
          <span className="text-xs font-medium">Mensagem</span>
        </Button>
      </div>
    </div>
  );
}
