import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppointmentCard } from "@/components/agenda/AppointmentCard";
import { Button } from "@/components/ui/button";

const appointments = [
  { id: "1", time: "09:00", clientName: "Carlos Mendes", service: "Corte Cabelo", price: "R$ 45", phone: "11999998888", status: "completed" as const },
  { id: "2", time: "09:30", clientName: "Roberto Silva", service: "Barba Completa", price: "R$ 35", phone: "11988887777", status: "completed" as const },
  { id: "3", time: "10:30", clientName: "André Costa", service: "Combo", price: "R$ 70", phone: "11977776666", status: "confirmed" as const },
  { id: "4", time: "11:00", clientName: "Paulo Santos", service: "Corte Cabelo", price: "R$ 45", phone: "11966665555", status: "confirmed" as const },
  { id: "5", time: "14:00", clientName: "Fernando Lima", service: "Hidratação", price: "R$ 50", phone: "11955554444", status: "pending" as const },
  { id: "6", time: "14:30", clientName: "Marcos Oliveira", service: "Corte Cabelo", price: "R$ 45", phone: "11944443333", status: "confirmed" as const },
  { id: "7", time: "15:00", clientName: "João Pedro", service: "Combo", price: "R$ 70", phone: "11933332222", status: "confirmed" as const },
  { id: "8", time: "16:00", clientName: "Ricardo Souza", service: "Barba Completa", price: "R$ 35", phone: "11922221111", status: "pending" as const },
];

const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDate = (date: Date) => {
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const goToPrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  const totalRevenue = appointments
    .filter(a => a.status !== "pending")
    .reduce((sum, a) => sum + parseInt(a.price.replace(/\D/g, '')), 0);

  const confirmedCount = appointments.filter(a => a.status === "confirmed" || a.status === "completed").length;
  const pendingCount = appointments.filter(a => a.status === "pending").length;

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Minha Agenda</h1>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="card-premium p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevDay}
              className="h-10 w-10 rounded-xl"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{formatDate(currentDate)}</p>
              {!isToday() && (
                <button 
                  onClick={goToToday}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Voltar para hoje
                </button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              className="h-10 w-10 rounded-xl"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="card-premium p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
            <p className="text-xs text-muted-foreground">Agendamentos</p>
          </div>
          <div className="card-premium p-3 text-center">
            <p className="text-2xl font-bold text-success">{confirmedCount}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </div>
          <div className="card-premium p-3 text-center">
            <p className="text-2xl font-bold text-primary">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Horários do Dia</h2>
            <span className="text-sm text-muted-foreground">
              Previsão: <span className="text-primary font-semibold">R$ {totalRevenue}</span>
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map((appointment, index) => (
              <div 
                key={appointment.id}
                className="animate-fade-in"
                style={{ animationDelay: `${250 + index * 50}ms` }}
              >
                <AppointmentCard appointment={appointment} />
              </div>
            ))}
          </div>
        </div>

        {/* Empty State (if needed) */}
        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento</h3>
            <p className="text-muted-foreground">Não há horários marcados para este dia.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
