"use client"

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { generateSlotsFromShift } from "@/lib/bookingSlots"; 
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, CheckCircle2, MapPin, Store, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProfessionalCard } from "@/components/booking/ProfessionalCard";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { Header } from "@/components/Header";
import { ReviewModal } from "@/components/discovery/ReviewModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    <div className="bg-card border border-border p-5 rounded-[2rem] animate-in zoom-in-95 duration-300 mt-4 shadow-sm">
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop")?.trim() || null;

  // ESTADOS
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [dateMode, setDateMode] = useState<'hoje' | 'amanha' | 'calendario'>('hoje');
  const [calendarDate, setCalendarDate] = useState<string>(new Date().toLocaleDateString("pt-BR"));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  const [detailsModalService, setDetailsModalService] = useState<any | null>(null);

  const todayStr = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);
  const tomorrowStr = useMemo(() => {
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toLocaleDateString("pt-BR");
  }, []);

  const selectedDate = dateMode === 'hoje' ? todayStr : dateMode === 'amanha' ? tomorrowStr : calendarDate;

  // 🚀 ENGINE DE DADOS (Busca Paralela)
  const { data: bookingData, isLoading: isDataLoading } = useQuery({
    queryKey: ["booking-engine-data", shopId],
    queryFn: async () => {
      if (!shopId) return { services: [], professionals: [], shop: null };

      const [
        { data: shopData },
        { data: profs },
        { data: svcs }
      ] = await Promise.all([
        supabase.from("barbearias").select("name, neighborhood, city, cover_image").eq("id", shopId).single(),
        supabase.from("profiles").select("id, name, instagram").eq("barbearia_id", shopId).eq("role", "barbeiro").eq("provides_services", true),
        supabase.from("services").select("*").eq("barbearia_id", shopId).order("name")
      ]);

      const professionalIds = (profs || []).map(p => p.id);

      if (professionalIds.length === 0) return { services: [], shop: shopData };

      const { data: bridge } = await supabase.from("barber_services")
        .select("*")
        .eq("is_active", true)
        .in("professional_id", professionalIds);

      const servicesMapped = (svcs || []).map(service => {
        const activeLinks = (bridge || []).filter((b: any) => b.service_id === service.id);
        
        const availableProfs = (profs || []).filter((p: any) => activeLinks.some((l: any) => l.professional_id === p.id)).map((p: any) => {
          const link = activeLinks.find((l: any) => l.professional_id === p.id);
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
          description: service.description || null,
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

      return { services: servicesMapped, shop: shopData };
    },
    enabled: !!shopId,
  });

  const services = bookingData?.services || [];
  const shopInfo = bookingData?.shop;
  
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

  useEffect(() => {
    const state = location.state as { preSelectServiceId?: string; preSelectProfessionalId?: string } | null;
    if (state?.preSelectServiceId && services.length > 0) {
      setSelectedService(state.preSelectServiceId);
      if (state?.preSelectProfessionalId) {
        setSelectedProfessional(state.preSelectProfessionalId);
      }
    }
  }, [location.state, services]);

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
      const { data } = await supabase.from("barber_work_hours")
        .select("start_time, end_time")
        .eq("professional_id", selectedProfessional)
        .eq("day_of_week", dayOfWeekInt)
        .maybeSingle();
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

  const checkoutButtonLabel = useMemo(() => {
    if (!selectedService) return "Selecione o Serviço desejado";
    if (!selectedProfessional) return "Escolha o Profissional na lista";
    if (!selectedTime) return "Escolha o Horário de atendimento";
    return `Confirmar Agendamento (${formatBRL(finalPrice)})`;
  }, [selectedService, selectedProfessional, selectedTime, finalPrice]);

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
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      <BookingAuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <Header />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-8">
        
        {/* 🚀 HEADER DE NAVEGAÇÃO E IDENTIDADE (Padrão Clean & Airy) */}
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-secondary/30 hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
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

          {/* 🚀 HERO SECTION DA BARBEARIA (Sem caixa gigante, flutuante e orgânico) */}
          {!isDataLoading && shopInfo && (
            <div className="flex items-center gap-5 px-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center shrink-0 border-2 border-border/50 shadow-xl overflow-hidden">
                {shopInfo.cover_image ? (
                  <img src={shopInfo.cover_image} alt={shopInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-primary/60" />
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter leading-none text-foreground mb-1.5">
                  {shopInfo.name || "Barbearia"}
                </h1>
                <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/30 w-fit px-3 py-1.5 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold tracking-wide truncate max-w-[200px] md:max-w-md">
                    {shopInfo.neighborhood || "Endereço não informado"}{shopInfo.city ? `, ${shopInfo.city}` : ""}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🚀 PASSO 1: SERVIÇOS */}
        <section className="space-y-5 transition-all duration-500 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedService ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 shadow-lg shadow-primary/30 animate-pulse">1</span>
              )}
              <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight">O que vamos fazer hoje?</h2>
            </div>
            {selectedService && (
              <button onClick={() => handleSelectService("")} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline bg-primary/10 px-3 py-1.5 rounded-full">Alterar</button>
            )}
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {isDataLoading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-32 w-full bg-secondary/50 animate-pulse rounded-3xl border border-border/50" />)
            ) : services.map((s) => (
              <ServiceCard 
                key={s.id} 
                service={{...s, duration: s.durationDisplay, promoText: null}} 
                isSelected={selectedService === s.id} 
                onSelect={handleSelectService}
                onShowDetails={(svc) => setDetailsModalService(svc)}
              />
            ))}
          </div>
        </section>

        {/* 🚀 PASSO 2: EQUIPE */}
        <section className={cn(
          "space-y-5 transition-all duration-500 pt-6",
          !selectedService && "opacity-30 pointer-events-none blur-[1px] grayscale-[50%]"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedProfessional ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
              ) : (
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0", 
                  selectedService ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse" : "bg-muted text-muted-foreground"
                )}>2</span>
              )}
              <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight">Com quem deseja cortar?</h2>
            </div>
            {selectedProfessional && (
              <button onClick={() => handleSelectProfessional("")} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline bg-primary/10 px-3 py-1.5 rounded-full">Alterar</button>
            )}
          </div>

          {selectedService && (
            // 🚀 TIER-1 FIX: Aplicado py-4 e margens negativas para o card do profissional não ser "degolado" ao ser selecionado
            <div className="flex gap-3 sm:gap-4 overflow-x-auto sm:flex-wrap py-4 -my-4 -mx-4 px-4 sm:mx-0 sm:px-1 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
              {availableProfessionalsForService.map((p) => (
                <div key={p.id} className="shrink-0 w-[150px] sm:w-[170px]">
                  <ProfessionalCard professional={p} isSelected={selectedProfessional === p.id} onSelect={handleSelectProfessional} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🚀 PASSO 3: CALENDÁRIO E HORAS */}
        <section className={cn(
          "space-y-6 transition-all duration-500 pt-6",
          (!selectedService || !selectedProfessional) && "opacity-30 pointer-events-none blur-[1px] grayscale-[50%]"
        )}>
          <div className="flex items-center gap-3">
            {selectedTime ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
            ) : (
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0", 
                selectedService && selectedProfessional ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse" : "bg-muted text-muted-foreground"
              )}>3</span>
            )}
            <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight">Data e Horário</h2>
          </div>

          {selectedService && selectedProfessional && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-secondary/10 p-5 sm:p-6 rounded-3xl border border-border/50">
              <div className="flex gap-2">
                <Button onClick={() => setDateMode('hoje')} variant={dateMode === 'hoje' ? 'default' : 'outline'} className={cn("rounded-xl font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none", dateMode === 'hoje' && "shadow-lg shadow-primary/20")}>Hoje</Button>
                <Button onClick={() => setDateMode('amanha')} variant={dateMode === 'amanha' ? 'default' : 'outline'} className={cn("rounded-xl font-black uppercase tracking-widest text-[10px] h-10 flex-1 sm:flex-none", dateMode === 'amanha' && "shadow-lg shadow-primary/20")}>Amanhã</Button>
                <Button onClick={() => setDateMode('calendario')} variant={dateMode === 'calendario' ? 'default' : 'outline'} className={cn("rounded-xl font-black uppercase tracking-widest text-[10px] h-10 border-dashed flex-1 sm:flex-none", dateMode === 'calendario' && "shadow-lg shadow-primary/20")}>
                  <CalendarIcon className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Escolher Dia</span>
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

      {/* 🚀 COCKPIT DE CHECKOUT */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto">
          <Button 
            onClick={handleProceedToCheckout} 
            disabled={!isBookingReady} 
            className={cn(
              "w-full h-14 sm:h-16 text-sm sm:text-base font-black uppercase italic tracking-tight rounded-2xl pointer-events-auto transition-all duration-300",
              isBookingReady ? "btn-primary-glow bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-[1.02]" : "bg-secondary text-muted-foreground border border-border/50 cursor-not-allowed shadow-none"
            )}
          >
            {checkoutButtonLabel}
          </Button>
        </div>
      </div>

      {/* 🚀 MODAL DE DETALHES DO SERVIÇO */}
      <Dialog open={!!detailsModalService} onOpenChange={(open) => !open && setDetailsModalService(null)}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md bg-[#0a0c12] border-border shadow-2xl rounded-3xl overflow-hidden">
          <DialogHeader className="px-4 pt-4 text-left">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground pr-6 break-words">
              {detailsModalService?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Detalhes completos do serviço selecionado</DialogDescription>
            <div className="flex items-center gap-3 mt-3 border-b border-border/50 pb-5">
              <span className="text-sm font-black text-primary tabular-nums">{detailsModalService?.priceDisplay}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Clock className="h-3.5 w-3.5" /> {detailsModalService?.duration}
              </span>
            </div>
          </DialogHeader>
          <div className="px-4 py-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Sobre o Serviço</h4>
            <div className="text-sm font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto scrollbar-thin pr-2 w-full">
              {detailsModalService?.description}
            </div>
          </div>
          
          <div className="p-4 bg-background/50 border-t border-border/30 flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setDetailsModalService(null)} 
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary/50 text-muted-foreground"
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                handleSelectService(detailsModalService?.id);
                setDetailsModalService(null);
              }} 
              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              Selecionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {shopId && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          shopId={shopId}
          shopName={shopInfo?.name || "a barbearia"}
        />
      )}
    </div>
  );
}