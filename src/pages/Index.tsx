"use client"

import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { generateSlotsFromShift, normalizeTimeHHMM } from "@/lib/bookingSlots"; // Removemos o ptBrDateToDayKey (não precisamos mais de strings!)
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProfessionalCard } from "@/components/booking/ProfessionalCard";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatDuration";
import { BookingAuthRequiredDialog } from "@/components/booking/BookingAuthRequiredDialog";
import type { BookingCheckoutState } from "@/types/booking";

type ServiceRow = {
  id: string;
  name: string;
  duration: string;
  price: string;
  durationMin: number;
  priceNumber: number;
};

type ProfessionalRow = {
  id: string;
  name: string;
  avatar?: string;
  specialty?: string;
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// 🗓️ SUB-COMPONENTE: CALENDÁRIO EM GRADE
function CalendarPicker({ selectedDate, onSelect }: { selectedDate: string; onSelect: (date: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toLocaleDateString("pt-BR");
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
            dateObj.toDateString() === today.toDateString() && !isSelected ? "border border-primary/40 text-primary" : "",
          )}
        >
          {day}
        </button>,
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysShort.map((d) => (
          <div key={d} className="text-[9px] font-black uppercase text-center text-muted-foreground opacity-40">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop")?.trim() || null;

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString("pt-BR"));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const onSelectService = useCallback((id: string) => {
    setSelectedService(id);
    setSelectedProfessional(null);
    setSelectedTime(null);
  }, []);

  const onSelectProfessional = useCallback((id: string) => {
    setSelectedProfessional(id);
    setSelectedTime(null);
  }, []);

  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["booking-services", shopId],
    queryFn: async (): Promise<ServiceRow[]> => {
      if (!shopId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("barbearia_id", shopId)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row: { id: string; name: string; price: number; duration_min: number }) => ({
        id: row.id,
        name: row.name,
        duration: formatDuration(row.duration_min),
        price: formatBRL(row.price),
        durationMin: row.duration_min,
        priceNumber: row.price,
      }));
    },
    enabled: !!shopId,
  });

  const { data: professionals = [], isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ["booking-barbers", shopId, selectedService],
    queryFn: async (): Promise<ProfessionalRow[]> => {
      if (!shopId || !selectedService) return [];

      const { data: links, error: e1 } = await supabase
        .from("barber_services")
        .select("barber_id")
        .eq("service_id", selectedService)
        .eq("is_active", true);

      if (e1) throw e1;
      const ids = [...new Set((links ?? []).map((l: { barber_id: string }) => l.barber_id))];
      if (ids.length === 0) return [];

      const { data: profs, error: e2 } = await supabase
        .from("profiles")
        .select("id, name, instagram")
        .in("id", ids)
        .eq("barbearia_id", shopId)
        .eq("role", "barbeiro");

      if (e2) throw e2;

      return (profs ?? []).map((p: { id: string; name: string; instagram: string | null }) => ({
        id: p.id,
        name: p.name ?? "Barbeiro",
        specialty: p.instagram ? `@${p.instagram.replace(/^@/, "")}` : undefined,
      }));
    },
    enabled: !!shopId && !!selectedService,
  });

  const selectedServiceRow = useMemo(
    () => services.find((s) => s.id === selectedService) ?? null,
    [services, selectedService],
  );

  const selectedProfessionalRow = useMemo(
    () => professionals.find((p) => p.id === selectedProfessional) ?? null,
    [professionals, selectedProfessional],
  );

  // 🚀 TIER-1: Tradução direta da Data escolhida para Inteiro (0 a 6)
  // O Javascript nativo converte isso perfeitamente e combinando com o Postgres.
  const dayOfWeekInt = useMemo(() => {
    if (!selectedDate) return null;
    const [day, month, year] = selectedDate.split("/").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getDay(); // Retorna 0 para Dom, 1 para Seg, etc.
  }, [selectedDate]);

  const { data: workHourRow, isLoading: isLoadingWorkHours } = useQuery({
    queryKey: ["barber-work-hours", selectedProfessional, dayOfWeekInt],
    queryFn: async () => {
      if (!selectedProfessional || dayOfWeekInt === null) return null;
      
      const { data, error } = await supabase
        .from("barber_work_hours")
        .select("start_time, end_time")
        .eq("barber_id", selectedProfessional)
        // 🚀 CORREÇÃO CIRÚRGICA: Coluna "day_of_week" e valor "dayOfWeekInt" (Integer)
        .eq("day_of_week", dayOfWeekInt) 
        .maybeSingle();

      if (error) throw error;
      return data as { start_time: string; end_time: string } | null;
    },
    enabled: !!selectedProfessional && dayOfWeekInt !== null && !!selectedService && !!shopId,
  });

  const { data: occupiedSlots = [], isLoading: isLoadingOccupied } = useQuery({
    queryKey: ["booked-slots", selectedProfessional, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      const [day, month, year] = selectedDate.split("/").map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_date, professional_id")
        .eq("professional_id", selectedProfessional)
        .gte("appointment_date", dayStart.toISOString())
        .lte("appointment_date", dayEnd.toISOString())
        .neq("status", "cancelado");

      if (error) throw error;

      return (data ?? []).map((a: { appointment_date: string }) => {
        const d = new Date(a.appointment_date);
        const hh = d.getHours().toString().padStart(2, "0");
        const mm = d.getMinutes().toString().padStart(2, "0");
        return `${hh}:${mm}`;
      });
    },
    enabled: !!selectedProfessional && !!selectedDate,
  });

  const slotsLoading =
    !!(selectedService && selectedProfessional && shopId) && (isLoadingWorkHours || isLoadingOccupied);

  const dynamicTimeSlots = useMemo(() => {
    if (!selectedServiceRow || !selectedProfessional || dayOfWeekInt === null) return [];

    if (!workHourRow) return []; // Se não houver horário gravado para esse dia da semana, retorna lista vazia.

    const start = normalizeTimeHHMM(workHourRow.start_time);
    const end = normalizeTimeHHMM(workHourRow.end_time);
    if (!start || !end) return [];

    const rawSlots = generateSlotsFromShift(workHourRow.start_time, workHourRow.end_time, selectedServiceRow.durationMin);

    const now = new Date();
    const isToday = selectedDate === now.toLocaleDateString("pt-BR");
    const [d, m, y] = selectedDate.split("/").map(Number);

    return rawSlots.map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const slotDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
      const isPast = isToday && slotDate < now;
      const isBooked = occupiedSlots.includes(time);

      return {
        id: time,
        time,
        available: !isPast && !isBooked,
      };
    });
  }, [selectedDate, selectedProfessional, selectedServiceRow, workHourRow, dayOfWeekInt, occupiedSlots]);

  const isBookingReady = selectedService && selectedProfessional && selectedDate && selectedTime;

  const handleProceedToCheckout = async () => {
    const service = services.find((s) => s.id === selectedService);
    const professional = professionals.find((p) => p.id === selectedProfessional);
    if (!shopId || !service || !professional || !selectedTime) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setAuthDialogOpen(true);
      return;
    }

    const [day, month, year] = selectedDate.split("/").map(Number);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const finalAppointmentDate = new Date(year, month - 1, day, hours, minutes);

    const payload: BookingCheckoutState = {
      shopId,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.priceNumber,
      totalPriceDisplay: service.price,
      professionalId: professional.id,
      professionalName: professional.name,
      appointmentDate: finalAppointmentDate.toISOString(),
      dateLabel: selectedDate === new Date().toLocaleDateString("pt-BR") ? "Hoje" : selectedDate,
      time: selectedTime,
    };

    navigate("/checkout", { state: payload });
  };

  const availabilityLabel =
    selectedDate === new Date().toLocaleDateString("pt-BR") ? "Hoje" : selectedDate;

  const slotEmptyMessage =
    !selectedService || !selectedProfessional
      ? "Selecione serviço e profissional para ver os horários"
      : undefined;

  return (
    <div className="min-h-screen bg-background pb-24">
      <BookingAuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <Header />

      <div className="container pt-24 py-6 space-y-12">
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Novo Agendamento</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Sincronizado com a agenda real
            </p>
          </div>
        </div>

        {!shopId && (
          <div className="rounded-[2rem] border border-dashed border-border bg-secondary/20 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">Barbearia não identificada</p>
            <p className="text-xs text-muted-foreground">
              Use um link válido com o parâmetro <span className="font-mono">?shop=</span> (ID da barbearia).
            </p>
          </div>
        )}

        {/* Passo 1: Serviços */}
        <section className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              1
            </span>
            <h2 className="text-lg font-black uppercase italic tracking-tight">O que vamos fazer hoje?</h2>
          </div>
          <div className="space-y-3">
            {isLoadingServices && shopId ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-24 w-full bg-secondary/50 animate-pulse rounded-2xl border border-border/50" />
              ))
            ) : (
              services.map((s) => (
                <ServiceCard key={s.id} service={s} isSelected={selectedService === s.id} onSelect={onSelectService} />
              ))
            )}
            {!isLoadingServices && shopId && services.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum serviço cadastrado nesta barbearia.</p>
            )}
          </div>
        </section>

        {/* Passo 2: Profissional */}
        <section className="space-y-4 animate-fade-in delay-100">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              2
            </span>
            <h2 className="text-lg font-black uppercase italic tracking-tight">Com quem deseja cortar?</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {!selectedService ? (
              <p className="text-xs text-muted-foreground py-4">Escolha um serviço para listar os profissionais.</p>
            ) : isLoadingProfessionals ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 shrink-0">
                  <div className="h-16 w-16 rounded-full bg-secondary/50 animate-pulse ring-2 ring-offset-2 ring-offset-background" />
                  <div className="h-3 w-16 bg-secondary/50 animate-pulse rounded" />
                </div>
              ))
            ) : (
              professionals.map((p) => (
                <ProfessionalCard
                  key={p.id}
                  professional={p}
                  isSelected={selectedProfessional === p.id}
                  onSelect={onSelectProfessional}
                />
              ))
            )}
            {!isLoadingProfessionals && selectedService && professionals.length === 0 && (
              <p className="text-xs text-muted-foreground py-4">Nenhum profissional disponível para este serviço.</p>
            )}
          </div>
        </section>

        {/* Passo 3: Calendário e Horários */}
        <section className="space-y-6 animate-fade-in delay-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
              3
            </span>
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
              Disponibilidade para {availabilityLabel}
            </p>
            <TimeSlotGrid
              slots={dynamicTimeSlots}
              selectedSlot={selectedTime}
              onSelect={setSelectedTime}
              isLoading={slotsLoading}
              emptyMessage={slotEmptyMessage}
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