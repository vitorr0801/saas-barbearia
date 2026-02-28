import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QueuedAppointment {
  id: string;
  time: string;
  clientName: string;
  service: string;
}

interface AppointmentQueueProps {
  appointments: QueuedAppointment[];
}

export function AppointmentQueue({ appointments }: AppointmentQueueProps) {
  if (appointments.length === 0) {
    return (
      <div className="p-6 border-t border-border">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Próximos
        </h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum agendamento na fila</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-t border-border">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Próximos ({appointments.length})
      </h3>
      
      <div className="space-y-3">
        {appointments.slice(0, 3).map((appointment, index) => (
          <div
            key={appointment.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/50 transition-opacity"
            style={{ opacity: 1 - index * 0.2 }}
          >
            {/* Time */}
            <div className="flex items-center gap-2 min-w-[70px]">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-semibold text-foreground">
                {appointment.time}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Client Info */}
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {appointment.clientName}
                </p>
              </div>
            </div>

            {/* Service Badge */}
            <Badge variant="secondary" className="shrink-0 bg-muted/50 text-muted-foreground">
              {appointment.service}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
