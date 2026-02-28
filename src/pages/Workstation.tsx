import { useState } from "react";
import { CurrentAppointmentCard } from "@/components/workstation/CurrentAppointmentCard";
import { AppointmentQueue } from "@/components/workstation/AppointmentQueue";
import { QuickActions } from "@/components/workstation/QuickActions";
import { DelayModal } from "@/components/workstation/DelayModal";
import { User, Calendar } from "lucide-react";
import { toast } from "sonner";

// Mock data - will be replaced with real data from Supabase
const mockQueue = [
  { id: "1", time: "15:00", clientName: "Roberto Silva", service: "Corte" },
  { id: "2", time: "15:30", clientName: "André Costa", service: "Barba" },
  { id: "3", time: "16:00", clientName: "Paulo Santos", service: "Combo" },
];

const mockCurrent = {
  clientName: "Carlos Mendes",
  serviceName: "Corte de Cabelo",
  phone: "11999998888",
  startTime: new Date(Date.now() - 25 * 60 * 1000), // Started 25 min ago
};

export default function Workstation() {
  const [currentAppointment, setCurrentAppointment] = useState<typeof mockCurrent | null>(mockCurrent);
  const [queue, setQueue] = useState(mockQueue);
  const [delayModalOpen, setDelayModalOpen] = useState(false);

  const handleFinishAppointment = () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentAppointment({
        clientName: next.clientName,
        serviceName: next.service,
        phone: "11988887777",
        startTime: new Date(),
      });
      setQueue(rest);
    } else {
      setCurrentAppointment(null);
    }
  };

  const handleCallNext = () => {
    if (queue.length > 0 && !currentAppointment) {
      const [next, ...rest] = queue;
      setCurrentAppointment({
        clientName: next.clientName,
        serviceName: next.service,
        phone: "11988887777",
        startTime: new Date(),
      });
      setQueue(rest);
      toast.success(`${next.clientName} foi chamado`);
    }
  };

  const handleMessage = () => {
    if (!currentAppointment) {
      toast.error("Nenhum cliente em atendimento");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Bancada 01</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {currentAppointment ? (
          <CurrentAppointmentCard
            clientName={currentAppointment.clientName}
            serviceName={currentAppointment.serviceName}
            startTime={currentAppointment.startTime}
            onFinish={handleFinishAppointment}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Bancada Livre
            </h2>
            <p className="text-muted-foreground text-center">
              Toque em "Chamar Próximo" para iniciar o atendimento
            </p>
          </div>
        )}

        {/* Queue Section */}
        <AppointmentQueue appointments={queue} />
      </div>

      {/* Quick Actions Footer */}
      <QuickActions
        onDelayClick={() => setDelayModalOpen(true)}
        onCallNextClick={handleCallNext}
        onMessageClick={handleMessage}
        hasCurrentAppointment={!!currentAppointment}
        currentClientPhone={currentAppointment?.phone}
      />

      {/* Delay Modal */}
      <DelayModal
        open={delayModalOpen}
        onOpenChange={setDelayModalOpen}
        nextClientName={queue[0]?.clientName}
      />
    </div>
  );
}
