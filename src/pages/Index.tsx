"use client"

import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { generateSlotsFromShift, normalizeTimeHHMM } from "@/lib/bookingSlots"; 
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProfessionalCard } from "@/components/booking/ProfessionalCard";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { Header } from "@/components/Header";
import { ReviewModal } from "@/components/discovery/ReviewModal";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatDuration";
import { BookingAuthRequiredDialog } from "@/components/booking/BookingAuthRequiredDialog";
import type { BookingCheckoutState } from "@/types/booking";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getPromoText(percentage: number | null, days: number[] | null) {
  if (!percentage || !days || days.length === 0) return null;
  const daysStr = days.map(d => DIAS_SEMANA[d]).join(", ");
  return `${percentage}% OFF (${daysStr})`;
}

// 🗓️ SUB-COMPONENTE: CALENDÁRIO EM GRADE
function CalendarPicker({ selectedDate, onSelect }: { selectedDate: string; onSelect: (date: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
      const isDisabled = isPast;

      days.push(
        <button
          key={day}
          disabled={isDisabled}
          onClick={() => onSelect(dateStr)}
          className={cn(
            "h-10 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center",
            isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" : "hover:bg-secondary",
            isDisabled ? "opacity-10 cursor-not-allowed italic" : "text-foreground",
          )}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-card border border-border p-5 rounded-[2rem] animate-in zoom-in-95 duration-300 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-primary">
          {months[viewDate.getMonth()]} <span className="text-muted-foreground">{viewDate.getFullYear()}</span>
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="h-8 w-8 rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="h-8 w-8 rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_SEMANA.map((d) => <div key={d} className="text-[9px] font-black uppercase text-center text-muted-foreground opacity-40">{d}</div>)}
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

  // ESTADOS
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<'hoje' | 'amanha' | 'calendario'>('hoje');
  const [calendarDate, setCalendarDate] = useState<string>(new Date().toLocaleDateString("pt-BR"));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // ESTADO DO MODAL DE AVALIAÇÃO
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);
  const tomorrowStr = useMemo(() => {
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toLocaleDateString("pt-BR");
  }, []);

  const selectedDate = dateMode === 'hoje' ? todayStr : dateMode === 'amanha' ? tomorrowStr : calendarDate;

  // ENGINE DE DADOS
  const { data: bookingData, isLoading: isDataLoading } = useQuery({
    queryKey: ["booking-engine-data", shopId],
    queryFn: async () => {
      if (!shopId) return { services: [], professionals: [] };

      const { data: profs } = await supabase.from("profiles").select("id, name, instagram")
        .eq("barbearia_id", shopId).eq("role", "barbeiro").eq("provides_services", true);
      
      const { data: svcs } = await supabase.from("services").select("*")
        .eq("barbearia_id", shopId).order("name");

      const { data: bridge } = await supabase.from("barber_services").select("*")
        .eq("is_active", true);

      const servicesMapped = (svcs || []).map(service => {
        const activeLinks = (bridge || []).filter((b: any) => b.service_id === service.id);
        const availableProfs = (profs || []).filter((p: any) => activeLinks.some((l: any) => l.barber_id === p.id)).map((p: any) => {
          const link = activeLinks.find((l: any) => l.barber_id === p.id);
          const price = link.custom_price ?? link.price ?? service.price;
          const duration = link.custom_duration ?? link.duration_min ?? service.duration_min;
          return { ...p, price, duration };
        });

        const prices = availableProfs.map(p => p.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : service.price;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : service.price;

        return {
          id: service.id,
          name: service.name,
          basePrice: service.price,
          promoPercentage: service.promo_percentage || 0,
          promoDays: service.promo_days || [],
          promoText: getPromoText(service.promo_percentage, service.promo_days),
          minPrice,
          isStartingPrice: minPrice < maxPrice,
          durationDisplay: formatDuration(service.duration_min),
          availableProfs,
          priceDisplay: minPrice < maxPrice ? `A partir de ${formatBRL(minPrice)}` : formatBRL(minPrice)
        };
      }).filter(s => s.availableProfs.length > 0);

      return { services: servicesMapped };
    },
    enabled: !!shopId,
  });

  const services = bookingData?.services || [];
  const selectedServiceObj = useMemo(() => services.find(s => s.id === selectedService), [services, selectedService]);
  
  const availableProfessionalsForService = useMemo(() => {
    if (!selectedServiceObj) return [];
    return selectedServiceObj.availableProfs.map((p: any) => ({
      id: p.id,
      name: p.name,
      specialty: p.instagram ? `@${p.instagram.replace(/^@/, "")}` : undefined,
      rawPrice: p.price,
      rawDuration: p.duration,
      priceDisplay: formatBRL(p.price)
    }));
  }, [selectedServiceObj]);

  const selectedProfessionalObj = useMemo(() => 
    availableProfessionalsForService.find((p: any) => p.id === selectedProfessional), 
  [availableProfessionalsForService, selectedProfessional]);

  const handleSelectService = (id: string) => {
    setSelectedService(id);
    setSelectedProfessional(null);
    setSelectedTime(null);
  };

  const handleSelectProfessional = (id: string) => {
    setSelectedProfessional(id);
    setSelectedTime(null);
  };

  const dayOfWeekInt = useMemo(() => {
    if (!selectedDate) return null;
    const [day, month, year] = selectedDate.split("/").map(Number);
    return new Date(year, month - 1, day).getDay(); 
  }, [selectedDate]);

  const { data: workHourRow, isLoading: isLoadingWorkHours } = useQuery({
    queryKey: ["barber-work-hours", selectedProfessional, dayOfWeekInt],
    queryFn: async () => {
      if (!selectedProfessional || dayOfWeekInt === null) return null;
      const { data } = await supabase.from("barber_work_hours").select("start_time, end_time").eq("barber_id", selectedProfessional).eq("day_of_week", dayOfWeekInt).maybeSingle();
      return data;
    },
    enabled: !!selectedProfessional && dayOfWeekInt !== null,
  });

  const { data: occupiedSlots = [], isLoading: isLoadingOccupied } = useQuery({
    queryKey: ["booked-slots", selectedProfessional, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional || !selectedDate) return [];
      const [day, month, year] = selectedDate.split("/").map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

      const { data } = await supabase.from("appointments").select("appointment_date")
        .eq("professional_id", selectedProfessional)
        .gte("appointment_date", dayStart.toISOString())
        .lte("appointment_date", dayEnd.toISOString())
        .not("status", "in", '("cancelado", "canceled", "cancelled")'); 

      return (data ?? []).map((a: any) => {
        const d = new Date(a.appointment_date);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      });
    },
    enabled: !!selectedProfessional && !!selectedDate,
  });

  const slotsLoading = !!(selectedService && selectedProfessional) && (isLoadingWorkHours || isLoadingOccupied);

  const dynamicTimeSlots = useMemo(() => {
    if (!selectedServiceObj || !selectedProfessionalObj || !workHourRow || dayOfWeekInt === null) return [];

    const rawSlots = generateSlotsFromShift(workHourRow.start_time, workHourRow.end_time, selectedProfessionalObj.rawDuration);
    const now = new Date();
    const isToday = selectedDate === todayStr;
    const [d, m, y] = selectedDate.split("/").map(Number);

    return rawSlots.map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const slotDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
      return { id: time, time, available: !(isToday && slotDate < now) && !occupiedSlots.includes(time) };
    });
  }, [selectedDate, selectedProfessionalObj, selectedServiceObj, workHourRow, occupiedSlots, todayStr, dayOfWeekInt]);

  const isPromoDay = useMemo(() => {
    if (!selectedServiceObj || dayOfWeekInt === null) return false;
    return selectedServiceObj.promoDays.includes(dayOfWeekInt);
  }, [selectedServiceObj, dayOfWeekInt]);

  const finalPrice = useMemo(() => {
    if (!selectedProfessionalObj || !selectedServiceObj) return 0;
    const base = selectedProfessionalObj.rawPrice;
    if (isPromoDay) {
      return base - (base * (selectedServiceObj.promoPercentage / 100));
    }
    return base;
  }, [selectedProfessionalObj, selectedServiceObj, isPromoDay]);

  const isBookingReady = selectedService && selectedProfessional && selectedDate && selectedTime;

  const handleProceedToCheckout = async () => {
    if (!shopId || !selectedServiceObj || !selectedProfessionalObj || !selectedTime) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setAuthDialogOpen(true);

    const [day, month, year] = selectedDate.split("/").map(Number);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const finalDate = new Date(year, month - 1, day, hours, minutes);

    const payload: BookingCheckoutState = {
      shopId,
      serviceId: selectedServiceObj.id,
      serviceName: selectedServiceObj.name,
      servicePrice: finalPrice, 
      totalPriceDisplay: formatBRL(finalPrice),  
      professionalId: selectedProfessionalObj.id,
      professionalName: selectedProfessionalObj.name,
      appointmentDate: finalDate.toISOString(),
      dateLabel: selectedDate === todayStr ? "Hoje" : selectedDate === tomorrowStr ? "Amanhã" : selectedDate,
      time: selectedTime,
    };

    navigate("/checkout", { state: payload });
  };

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <BookingAuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <Header />

      <div className="container pt-24 py-6 space-y-12">
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Novo Agendamento</h1>
            </div>
          </div>
          
          {shopId && (
            <Button 
              onClick={() => setIsReviewModalOpen(true)} 
              variant="outline" 
              size="sm" 
              className="h-9 rounded-xl border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 font-black uppercase tracking-widest text-[10px]"
            >
              <Star className="w-3.5 h-3.5 mr-1.5" /> Avaliar
            </Button>
          )}
        </div>

        <section className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">1</span>
            <h2 className="text-lg font-black uppercase italic tracking-tight">O que vamos fazer hoje?</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {isDataLoading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-24 w-full bg-secondary/50 animate-pulse rounded-2xl border" />)
            ) : services.map((s) => (
              <ServiceCard key={s.id} service={{...s, duration: s.durationDisplay, promoText: null}} isSelected={selectedService === s.id} onSelect={handleSelectService} />
            ))}
          </div>
        </section>

        <section className="space-y-4 animate-fade-in delay-100">
          <div className="flex items-center gap-3">
            <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0", selectedService ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</span>
            <h2 className={cn("text-lg font-black uppercase italic tracking-tight transition-colors", selectedService ? "text-foreground" : "text-muted-foreground")}>Com quem deseja cortar?</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {!selectedService ? (
               <p className="text-xs text-muted-foreground py-4 px-2 font-medium">Selecione o serviço para ver a equipe.</p>
            ) : availableProfessionalsForService.map((p) => (
              <ProfessionalCard key={p.id} professional={p} isSelected={selectedProfessional === p.id} onSelect={handleSelectProfessional} />
            ))}
          </div>
        </section>

        <section className="space-y-6 animate-fade-in delay-200">
          <div className="flex items-center gap-3">
            <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0", selectedService && selectedProfessional ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>3</span>
            <h2 className={cn("text-lg font-black uppercase italic tracking-tight transition-colors", selectedService && selectedProfessional ? "text-foreground" : "text-muted-foreground")}>Data e Horário</h2>
          </div>

          {selectedService && selectedProfessional && (
            <div className="space-y-6 animate-in slide-in-from-top-4">
              
              <div className="flex gap-2">
                <Button onClick={() => setDateMode('hoje')} variant={dateMode === 'hoje' ? 'default' : 'outline'} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10">Hoje</Button>
                <Button onClick={() => setDateMode('amanha')} variant={dateMode === 'amanha' ? 'default' : 'outline'} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10">Amanhã</Button>
                <Button onClick={() => setDateMode('calendario')} variant={dateMode === 'calendario' ? 'default' : 'outline'} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 border-dashed">
                  <CalendarIcon className="w-3.5 h-3.5 mr-2" /> Escolher Dia
                </Button>
              </div>

              {dateMode === 'calendario' && (
                <CalendarPicker selectedDate={calendarDate} onSelect={(date) => { setCalendarDate(date); setSelectedTime(null); }} />
              )}
              
              <TimeSlotGrid 
                slots={dynamicTimeSlots} 
                selectedSlot={selectedTime} 
                onSelect={setSelectedTime} 
                isLoading={slotsLoading} 
                promoPercentage={isPromoDay ? selectedServiceObj?.promoPercentage : null}
              />
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50 pointer-events-none">
        <Button 
          onClick={handleProceedToCheckout} 
          disabled={!isBookingReady} 
          className="w-full h-14 btn-primary-glow text-lg font-black uppercase italic tracking-tight disabled:opacity-30 pointer-events-auto"
        >
          {isBookingReady ? `Confirmar (${formatBRL(finalPrice)})` : "Finalize os passos acima"}
        </Button>
      </div>

      {shopId && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          shopId={shopId}
          shopName="a barbearia"
        />
      )}

    </div>
  );
}