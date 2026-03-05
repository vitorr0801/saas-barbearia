import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProfessionalCard } from "@/components/booking/ProfessionalCard";
import { DatePickerScroll } from "@/components/booking/DatePickerScroll";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { NavLink } from "@/components/NavLink";
import { DesktopNav } from "@/components/layout/DesktopNav";

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

const generateDates = () => {
  const dates = [];
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push({
      id: `date-${i}`,
      dayName: days[date.getDay()],
      dayNumber: date.getDate().toString(),
      isToday: i === 0,
    });
  }
  return dates;
};

const timeSlots = [
  { id: "t1", time: "09:00", available: true },
  { id: "t2", time: "09:30", available: true },
  { id: "t3", time: "10:00", available: false },
  { id: "t4", time: "10:30", available: true },
  { id: "t5", time: "11:00", available: true },
  { id: "t6", time: "11:30", available: false },
  { id: "t7", time: "14:00", available: true },
  { id: "t8", time: "14:30", available: true },
  { id: "t9", time: "15:00", available: true },
  { id: "t10", time: "15:30", available: false },
  { id: "t11", time: "16:00", available: true },
  { id: "t12", time: "16:30", available: true },
  { id: "t13", time: "17:00", available: true },
  { id: "t14", time: "17:30", available: false },
  { id: "t15", time: "18:00", available: true },
  { id: "t16", time: "18:30", available: true },
];

export default function Index() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>("date-0");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dates = generateDates();
  
  const isBookingReady = selectedService && selectedProfessional && selectedDate && selectedTime;

  const handleProceedToCheckout = () => {
    const service = services.find(s => s.id === selectedService);
    const professional = professionals.find(p => p.id === selectedProfessional);
    const date = dates.find(d => d.id === selectedDate);
    const time = timeSlots.find(t => t.id === selectedTime);
    
    navigate("/checkout", {
      state: {
        serviceName: service?.name || "",
        professionalName: professional?.name || "",
        date: date?.isToday ? "Hoje" : `${date?.dayName}, ${date?.dayNumber}`,
        time: time?.time || "",
        totalPrice: service?.price || "",
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <DesktopNav />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-amber flex items-center justify-center">
                <Scissors className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">BarberPro</h1>
                <p className="text-xs text-muted-foreground">Book your cut</p>
              </div>
            </div>

            <nav className="hidden xs:flex items-center gap-1">
              <NavLink
                to="/dashboard"
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm text-muted-foreground hover:bg-secondary transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/agendamentos"
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm text-muted-foreground hover:bg-secondary transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                Agendamentos
              </NavLink>
              <NavLink
                to="/financeiro"
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm text-muted-foreground hover:bg-secondary transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                Financeiro
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-8">
        {/* Step 1: Services */}
        <section className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              1
            </span>
            <h2 className="text-lg font-semibold text-foreground">Escolha o Serviço</h2>
          </div>
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedService === service.id}
                onSelect={setSelectedService}
              />
            ))}
          </div>
        </section>

        {/* Step 2: Professional */}
        <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              2
            </span>
            <h2 className="text-lg font-semibold text-foreground">Escolha o Profissional</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {professionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                isSelected={selectedProfessional === professional.id}
                onSelect={setSelectedProfessional}
              />
            ))}
          </div>
        </section>

        {/* Step 3: Date & Time */}
        <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              3
            </span>
            <h2 className="text-lg font-semibold text-foreground">Data e Horário</h2>
          </div>
          
          <div className="mb-6">
            <DatePickerScroll
              dates={dates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-3">Horários disponíveis</p>
            <TimeSlotGrid
              slots={timeSlots}
              selectedSlot={selectedTime}
              onSelect={setSelectedTime}
            />
          </div>
        </section>
      </div>

      {/* Fixed CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleProceedToCheckout}
          disabled={!isBookingReady}
          className="w-full h-14 btn-primary-glow text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Confirmar Agendamento
        </Button>
      </div>
    </div>
  );
}
