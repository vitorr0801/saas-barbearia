import { Calendar, Clock, CreditCard, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const upcomingAppointment = {
  date: "28 Fev, 14:30",
  shop: "Barbearia Central",
  service: "Corte + Barba",
  barber: "Rafael Lima",
};

const pastAppointments = [
  { date: "15 Fev", service: "Corte de Cabelo", shop: "Barbearia Central" },
  { date: "02 Fev", service: "Combo Completo", shop: "Studio Barber" },
  { date: "18 Jan", service: "Barba", shop: "Barbearia Central" },
];

export function ClientActivityHub() {
  return (
    <div className="space-y-4">
      {/* Upcoming */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          Meus Agendamentos
        </h2>

        {/* Next appointment */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-primary/20 text-primary border-0 text-xs">Próximo</Badge>
            <span className="text-sm font-medium text-primary">{upcomingAppointment.date}</span>
          </div>
          <p className="font-semibold text-foreground">{upcomingAppointment.service}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {upcomingAppointment.shop} • {upcomingAppointment.barber}
          </p>
          <Button variant="outline" size="sm" className="mt-3 text-xs border-border">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Adiar
          </Button>
        </div>

        {/* History */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Histórico</p>
          {pastAppointments.map((apt, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{apt.service}</p>
                <p className="text-xs text-muted-foreground">{apt.shop}</p>
              </div>
              <span className="text-xs text-muted-foreground">{apt.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          Minha Carteira
        </h2>
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Visa •••• 4242</p>
              <p className="text-xs text-muted-foreground">Cartão preferido</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
