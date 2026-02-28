import { MessageCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const riskClients = [
  { id: 1, name: "Carlos Mendes", lastVisit: "48 dias atrás", phone: "11999998888" },
  { id: 2, name: "Roberto Silva", lastVisit: "52 dias atrás", phone: "11988887777" },
  { id: 3, name: "André Costa", lastVisit: "45 dias atrás", phone: "11977776666" },
  { id: 4, name: "Paulo Santos", lastVisit: "60 dias atrás", phone: "11966665555" },
];

export function ClientRiskList() {
  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/55${phone}?text=Olá! Sentimos sua falta aqui na barbearia. Que tal agendar um horário?`, '_blank');
  };

  return (
    <div className="card-premium p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Clientes em Risco</h3>
          <p className="text-sm text-muted-foreground">Sem visita há mais de 45 dias</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {riskClients.map((client) => (
          <div 
            key={client.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.lastVisit}</p>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-success hover:text-success hover:bg-success/10"
              onClick={() => handleWhatsApp(client.phone)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
