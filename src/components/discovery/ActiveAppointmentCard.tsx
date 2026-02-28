import { Clock, MapPin, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActiveAppointment {
  id: string;
  shopName: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
}

interface ActiveAppointmentCardProps {
  appointment: ActiveAppointment | null;
}

export function ActiveAppointmentCard({ appointment }: ActiveAppointmentCardProps) {
  if (!appointment) return null;

  const handleOpenMap = () => {
    const encodedAddress = encodeURIComponent(appointment.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  return (
    <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Badge className="bg-primary/20 text-primary border-0 mb-2">
              Próximo Agendamento
            </Badge>
            <h3 className="font-bold text-foreground text-lg truncate">
              {appointment.shopName}
            </h3>
            <p className="text-muted-foreground text-sm truncate">
              {appointment.serviceName}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">
                {appointment.date} às {appointment.time}
              </span>
            </div>
          </div>
          <Button
            onClick={handleOpenMap}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 gap-1.5"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Abrir no Mapa</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
