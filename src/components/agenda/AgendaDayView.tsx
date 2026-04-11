"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2, Phone, User, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatDuration";
import { toast } from "@/hooks/use-toast";

type AppointmentStatus = "pendente" | "confirmado" | "concluido" | "cancelado" | string;

type AgendaRow = {
  id: string;
  appointment_date: string;
  status: AppointmentStatus;
  total_price: number | null;
  price: number | null;
  professional_id: string | null;
  client: { name: string | null; phone: string | null } | null;
  services: { name: string | null; duration_min: number | null } | null;
  professional: { name: string | null } | null;
};

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function parseLocalDateKey(key: string): Date {
  const [y, m, day] = key.split("-").map(Number);
  return new Date(y, m - 1, day, 12, 0, 0, 0);
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function statusBadgeClass(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s === "concluido" || s === "completed") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  }
  if (s === "cancelado" || s === "canceled" || s === "cancelled") {
    return "border-destructive/40 bg-destructive/10 text-destructive line-through decoration-destructive/50";
  }
  if (s === "confirmado") {
    return "border-sky-500/40 bg-sky-500/15 text-sky-600 dark:text-sky-400";
  }
  return "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-400";
}

function statusLabel(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (!s) return "—";
  if (s === "pending") return "Pendente";
  if (s === "canceled" || s === "cancelled") return "Cancelado";
  if (s === "completed") return "Concluído";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function AgendaDayView() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = Boolean(currentUser?.is_admin);
  const barbeariaId = currentUser?.barbearia_id ?? null;
  const userId = currentUser?.id ?? null;

  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()));

  const dateKey = useMemo(() => toLocalDateKey(selectedDay), [selectedDay]);

  const dayStart = useMemo(() => startOfLocalDay(selectedDay), [selectedDay]);
  const dayEnd = useMemo(() => endOfLocalDay(selectedDay), [selectedDay]);

  const queryEnabled = Boolean(userId) && (isAdmin ? Boolean(barbeariaId) : true);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["daily-agenda", userId, isAdmin, barbeariaId, dateKey],
    queryFn: async (): Promise<AgendaRow[]> => {
      if (!userId) return [];

      let q = supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          status,
          total_price,
          price,
          professional_id,
          client:profiles!client_id ( name, phone ),
          services:service_id ( name, duration_min ),
          professional:profiles!professional_id ( name )
        `,
        )
        .gte("appointment_date", dayStart.toISOString())
        .lte("appointment_date", dayEnd.toISOString())
        .order("appointment_date", { ascending: true });

      if (isAdmin) {
        if (!barbeariaId) return [];
        q = q.eq("barbearia_id", barbeariaId);
      } else {
        q = q.eq("professional_id", userId);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []) as AgendaRow[];
    },
    enabled: queryEnabled,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      void queryClient.invalidateQueries({ queryKey: ["daily-agenda"] });
      void queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: v.status === "concluido" ? "Atendimento concluído" : "Agendamento cancelado",
        description: "A agenda foi atualizada.",
      });
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: "Não foi possível atualizar",
        description: e.message,
      });
    },
  });

  const goToday = () => setSelectedDay(startOfLocalDay(new Date()));
  const goTomorrow = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setSelectedDay(startOfLocalDay(t));
  };
  const shiftDay = (delta: number) => {
    const n = new Date(selectedDay);
    n.setDate(n.getDate() + delta);
    setSelectedDay(startOfLocalDay(n));
  };

  const isToday = toLocalDateKey(selectedDay) === toLocalDateKey(new Date());

  if (!userId) return null;

  if (isAdmin && !barbeariaId) {
    return (
      <section className="dash-card w-full border-dashed p-6 md:p-8">
        <h2 className="text-base font-black uppercase italic tracking-tight text-foreground">Agenda do dia</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Associe sua conta a uma barbearia para ver a agenda da equipe.
        </p>
      </section>
    );
  }

  return (
    <section className="dash-card w-full space-y-5 md:space-y-6 p-5 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-8">
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            Agenda do dia
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
            {isAdmin ? "Todos os profissionais da barbearia" : "Seus horários"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:shrink-0">
          <Button
            type="button"
            variant={isToday ? "default" : "outline"}
            size="sm"
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-wide"
            onClick={goToday}
          >
            Hoje
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-wide"
            onClick={goTomorrow}
          >
            Amanhã
          </Button>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shiftDay(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[9rem] text-center text-xs font-bold text-foreground capitalize px-2">
              {formatDisplayDate(selectedDay)}
            </span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shiftDay(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setSelectedDay(startOfLocalDay(parseLocalDateKey(v)));
            }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground min-w-[10rem]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 md:py-24 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Carregando agenda…</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 py-16 md:py-20 text-center w-full">
          <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Nenhum agendamento neste dia</p>
        </div>
      ) : (
        <ul className="space-y-3 md:space-y-4 w-full">
          {appointments.map((apt) => {
            const dt = new Date(apt.appointment_date);
            const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const clientName = apt.client?.name ?? "Cliente";
            const phone = apt.client?.phone ?? "—";
            const serviceName = apt.services?.name ?? "Serviço";
            const duration =
              apt.services?.duration_min != null ? formatDuration(apt.services.duration_min) : "—";
            const value = apt.total_price ?? apt.price ?? 0;
            const st = String(apt.status ?? "").toLowerCase();
            const isFinal =
              st === "concluido" ||
              st === "completed" ||
              st === "cancelado" ||
              st === "canceled" ||
              st === "cancelled";
            const barberName = apt.professional?.name;

            return (
              <li
                key={apt.id}
                className={cn(
                  "rounded-xl border border-border bg-background/60 w-full transition-colors",
                  "p-4 md:p-5 lg:p-6",
                  "grid grid-cols-1 xl:grid-cols-[minmax(8rem,auto)_1fr_auto] gap-4 md:gap-6 items-start xl:items-center",
                  st === "cancelado" || st === "canceled" ? "opacity-70" : "",
                )}
              >
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                  <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-black tabular-nums text-foreground leading-none">{timeStr}</p>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mt-1.5">
                      <Scissors className="h-3 w-3 shrink-0" />
                      {duration}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-black uppercase tracking-wider", statusBadgeClass(apt.status))}
                    >
                      {statusLabel(apt.status)}
                    </Badge>
                    {isAdmin && barberName && (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">• {barberName}</span>
                    )}
                  </div>
                  <p className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 break-words">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    {clientName}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 break-all">
                    <Phone className="h-4 w-4 shrink-0" />
                    {phone}
                  </p>
                  <p className="text-sm md:text-base text-foreground">
                    <span className="text-muted-foreground">Serviço:</span> {serviceName}
                  </p>
                  <p className="text-base md:text-lg font-bold text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))}
                  </p>
                </div>

                <div className="flex flex-wrap xl:flex-col gap-2 shrink-0 w-full xl:w-auto xl:min-w-[9rem]">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isFinal || updateStatus.isPending}
                    className="rounded-xl h-10 text-[10px] font-black uppercase tracking-wide flex-1 xl:flex-none bg-emerald-600 hover:bg-emerald-600/90 text-white"
                    onClick={() => updateStatus.mutate({ id: apt.id, status: "concluido" })}
                  >
                    Concluir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isFinal || updateStatus.isPending}
                    className="rounded-xl h-10 text-[10px] font-black uppercase tracking-wide flex-1 xl:flex-none border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => updateStatus.mutate({ id: apt.id, status: "cancelado" })}
                  >
                    Cancelar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
