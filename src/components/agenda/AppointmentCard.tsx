import { MessageCircle, Clock, User, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: string;
  time: string;
  clientName: string;
  service: string;
  price: string;
  phone: string;
  status: "confirmed" | "pending" | "completed";
}

interface AppointmentCardProps {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/55${appointment.phone.replace(/\D/g, '')}?text=Olá ${appointment.clientName}! Confirmando seu horário às ${appointment.time} na barbearia.`,
      '_blank'
    );
  };

  const statusStyles = {
    confirmed: "border-success/30 bg-success/5",
    pending: "border-primary/30 bg-primary/5",
    completed: "border-muted bg-muted/20 opacity-60",
  };

  const statusLabels = {
    confirmed: "Confirmado",
    pending: "Aguardando",
    completed: "Concluído",
  };

  return (
    <div className={cn(
      "relative flex items-stretch gap-4 p-4 rounded-xl border transition-all",
      statusStyles[appointment.status]
    )}>
      {/* Time Column */}
      <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-border pr-4">
        <Clock className="h-4 w-4 text-muted-foreground mb-1" />
        <span className="text-xl font-bold text-foreground">{appointment.time}</span>
      </div>

      {/* Details Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground truncate">{appointment.clientName}</h3>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{appointment.service}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">{appointment.price}</span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            appointment.status === "confirmed" && "bg-success/20 text-success",
            appointment.status === "pending" && "bg-primary/20 text-primary",
            appointment.status === "completed" && "bg-muted text-muted-foreground"
          )}>
            {statusLabels[appointment.status]}
          </span>
        </div>
      </div>

      {/* WhatsApp Action */}
      <div className="flex items-center">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleWhatsApp}
          className="h-12 w-12 rounded-xl bg-success/10 text-success hover:bg-success/20 hover:text-success"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
