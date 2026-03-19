"use client"

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Scissors, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProfessionalCard } from "@/components/booking/ProfessionalCard";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

// --- CONFIGURAÇÃO DE HORÁRIOS ---
const BUSINESS_HOURS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

const services = [
  { id: "1", name: "Corte Cabelo", duration: "30 min", price: "R$ 45" },
  { id: "2", name: "Barba Completa", duration: "25 min", price: "R$ 35" },
  { id: "3", name: "Combo (Corte + Barba)", duration: "50 min", price: "R$ 70" },
  { id: "4", name: "Corte Infantil", duration: "25 min", price: "R$ 35" },
  { id: "5", name: "Hidratação", duration: "40 min", price: "R$ 50" },
];

const professionals = [
  { id: "1", name: "Rafael", specialty: "Degradê" },
  { id: "2", name: "Bruno", specialty: "Barba" },
  { id: "3", name: "Lucas", specialty: "Clássico" },
  { id: "4", name: "Pedro", specialty: "Afro" },
];

// 🗓️ SUB-COMPONENTE: CALENDÁRIO EM GRADE
function CalendarPicker({ selectedDate, onSelect }: { selectedDate: string, onSelect: (date: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toLocaleDateString('pt-BR');
      const isSelected = selectedDate === dateStr;
      
      const isPast = dateObj < today;
      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 60);
      const isTooFar = dateObj > maxDate;
      const isDisabled = isPast || isTooFar;

      days.push(
        <button
          key={day}
          disabled={isDisabled}
          onClick={() => onSelect(dateStr)}
          className={cn(
            "h-10 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center",
            isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" : "hover:bg-secondary",
            isDisabled ? "opacity-10 cursor-not-allowed italic" : "text-foreground",
            dateObj.toDateString() === today.toDateString() && !isSelected ? "border border-primary/40 text-primary" : ""
          )}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-card border border-border p-5 rounded-[2rem] animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-primary">
          {months[viewDate.getMonth()]} <span className="text-muted-foreground">{viewDate.getFullYear()}</span>
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="h-8 w-8 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="h-8 w-8 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysShort.map(d => <div key={d} className="text-[9px] font-black uppercase text-center text-muted-foreground opacity-40">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function Index() {
  const navigate = useNavigate();
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('pt-BR'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 📡 BUSCA DE OCUPAÇÃO
  const { data: occupiedSlots = [], isLoading: isLoadingOccupied } = useQuery({
    queryKey: ["booked-slots", selectedProfessional, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("time")
        .eq("professional_id", selectedProfessional)
        .eq("date", selectedDate)
        .neq("status", "cancelado");

      if (error) throw error;
      return data?.map(a => a.time) || [];
    },
    enabled: !!selectedProfessional && !!selectedDate,
  });

  // 🕒 FILTRO DE HORÁRIOS DINÂMICO
  const dynamicTimeSlots = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === now.toLocaleDateString('pt-BR');

    return BUSINESS_HOURS.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const slotDate = new Date();
      slotDate.setHours(hours, minutes, 0, 0);

      const isPast = isToday && slotDate < now;
      const isBooked = occupiedSlots.includes(time);

      return {
        id: time,
        time: time,
        available: !isPast && !isBooked
      };
    });
  }, [selectedDate, occupiedSlots]);

  const isBookingReady = selectedService && selectedProfessional && selectedDate && selectedTime;

  // 🔥 AJUSTE DE ELITE: Resolvendo o bug do horário no Cursor
  const handleProceedToCheckout = () => {
    const service = services.find(s => s.id === selectedService);
    const professional = professionals.find(p => p.id === selectedProfessional);
    
    // 🛠️ FUSÃO: Pegamos "22/03/2026" + "14:30" e criamos um objeto Date real
    const [day, month, year] = selectedDate.split('/').map(Number);
    const [hours, minutes] = selectedTime!.split(':').map(Number);
    
    // Mês no JS começa em 0, por isso o -1
    const finalAppointmentDate = new Date(year, month - 1, day, hours, minutes);

    navigate("/checkout", {
      state: {
        serviceId: service?.id,
        serviceName: service?.name || "",
        professionalId: professional?.id,
        professionalName: professional?.name || "",
        // 🚀 PASSANDO O HORÁRIO REAL:
        appointmentDate: finalAppointmentDate.toISOString(), 
        totalPrice: service?.price || "",
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="container pt-24 py-6 space-y-12">
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Novo Agendamento</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Sincronizado com a agenda real</p>
          </div>
        </div>

        {/* Passo 1: Serviços */}
        <section className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">1</span>
            <h2 className="text-lg font-black uppercase italic tracking-tight">O que vamos fazer hoje?</h2>
          </div>
          <div className="space-y-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} isSelected={selectedService === s.id} onSelect={setSelectedService} />
            ))}
          </div>
        </section>

        {/* Passo 2: Profissional */}
        <section className="space-y-4 animate-fade-in delay-100">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">2</span>
            <h2 className="text-lg font-black uppercase italic tracking-tight">Com quem deseja cortar?</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {professionals.map((p) => (
              <ProfessionalCard key={p.id} professional={p} isSelected={selectedProfessional === p.id} onSelect={setSelectedProfessional} />
            ))}
          </div>
        </section>

        {/* Passo 3: Calendário e Horários */}
        <section className="space-y-6 animate-fade-in delay-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">3</span>
            <h2 className="text-lg font-black uppercase italic tracking-tight">Data e Horário</h2>
          </div>
          
          <CalendarPicker 
            selectedDate={selectedDate} 
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }} 
          />
          
          <div className="space-y-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Disponibilidade para {selectedDate === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : selectedDate}
            </p>
            <TimeSlotGrid
              slots={dynamicTimeSlots}
              selectedSlot={selectedTime}
              onSelect={setSelectedTime}
              isLoading={isLoadingOccupied}
            />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50">
        <Button
          onClick={handleProceedToCheckout}
          disabled={!isBookingReady}
          className="w-full h-14 btn-primary-glow text-lg font-black uppercase italic tracking-tight disabled:opacity-30"
        >
          {isBookingReady ? "Confirmar e Ir para Pagamento" : "Finalize os passos acima"}
        </Button>
      </div>
    </div>
  );
}