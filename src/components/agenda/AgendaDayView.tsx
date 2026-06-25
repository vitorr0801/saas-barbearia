"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Loader2, 
  User, 
  Scissors, 
  CheckCircle2, 
  XCircle,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { startOfDay, endOfDay, format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaDayViewProps {
  selectedDay: Date;
  onSelectedDayChange: (d: Date) => void;
  filterProfessionalId?: string | null;
}

type AgendaRow = {
  id: string;
  appointment_date: string;
  status: string;
  total_price: number | null;
  professional_id: string | null;
  client: { name: string | null; phone: string | null } | null;
  services: { name: string | null; duration_min: number | null } | null;
  professional: { name: string | null } | null;
};

const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getStatusConfig = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s === "completed") {
    return { label: "Concluído", class: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" };
  }
  if (s === "cancelled") {
    return { label: "Cancelado", class: "border-destructive/30 bg-destructive/10 text-destructive line-through" };
  }
  return { label: "Pendente", class: "border-amber-500/30 bg-amber-500/10 text-amber-500" };
};

export function AgendaDayView({ selectedDay, onSelectedDayChange, filterProfessionalId }: AgendaDayViewProps) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // 🚀 RBAC: PERMISSÕES DE GESTÃO DA AGENDA
  const isOwner = Boolean(currentUser?.is_admin);
  const userJob = (currentUser?.job_title || "barbeiro").toLowerCase().trim();
  const barbeariaId = currentUser?.barbearia_id;
  const userId = currentUser?.id;

  const canSeeAllAgendas = isOwner || userJob === "gerente" || userJob === "secretária" || userJob === "secretaria";

  const isoRange = useMemo(() => {
    const safeDate = isValid(selectedDay) ? selectedDay : new Date();
    return {
      start: startOfDay(safeDate).toISOString(),
      end: endOfDay(safeDate).toISOString()
    };
  }, [selectedDay]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["daily-agenda", barbeariaId, userId, isoRange, filterProfessionalId, canSeeAllAgendas],
    queryFn: async (): Promise<AgendaRow[]> => {
      if (!barbeariaId || !userId) return [];

      let q = supabase
        .from("appointments")
        .select(`
          id, appointment_date, status, total_price, professional_id,
          client:profiles!client_id ( name, phone ),
          services:service_id ( name, duration_min ),
          professional:profiles!professional_id ( name )
        `)
        .eq("barbearia_id", barbeariaId)
        .gte("appointment_date", isoRange.start)
        .lte("appointment_date", isoRange.end)
        .order("appointment_date", { ascending: true });

      // Se não tem superpoderes, trava a busca no próprio ID
      if (!canSeeAllAgendas) {
        q = q.eq("professional_id", userId);
      } else if (filterProfessionalId && filterProfessionalId !== "__all__") {
        q = q.eq("professional_id", filterProfessionalId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as AgendaRow[]) || [];
    },
    enabled: !!barbeariaId && !!userId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-agenda"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Status atualizado com sucesso!"); 
    },
    onError: () => toast.error("Falha ao atualizar status."),
  });

  const shiftDay = (delta: number) => {
    const next = new Date(selectedDay);
    if (!isValid(next)) return;
    next.setDate(next.getDate() + delta);
    onSelectedDayChange(next);
  };

  if (!userId) return null;

  return (
    <section className="dash-card w-full space-y-6 p-5 md:p-8 bg-card/40 backdrop-blur-md border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agenda do Dia
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {isValid(selectedDay) ? format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Data Inválida"}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/50 p-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDay(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-foreground tabular-nums">
            {isValid(selectedDay) ? format(selectedDay, "dd/MM/yyyy") : "--/--/----"}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDay(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Agenda...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border-2 border-dashed border-border/40 bg-muted/5 text-center">
          <Calendar className="h-8 w-8 text-primary/20 mb-4" />
          <p className="text-sm font-black uppercase italic text-foreground">Dia Livre</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Sem compromissos para esta data</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const statusConfig = getStatusConfig(apt.status);
            const isFinished = ["completed", "cancelled"].includes(apt.status?.toLowerCase());
            
            const isOwnerOfApt = apt.professional_id === userId;
            // 🚀 PODER DE CONCLUIR: É o dono do agendamento OU tem superpoderes!
            const canManage = (isOwnerOfApt || canSeeAllAgendas) && !isFinished;

            const clientName = apt.client?.name || "Agendamento Manual";
            const professionalName = apt.professional?.name || "Indefinido";

            return (
              <div key={apt.id} className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/60 bg-background/40 p-5 transition-all hover:bg-card/60",
                isFinished && "opacity-60",
                !isOwnerOfApt && "border-l-4 border-l-muted"
              )}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  
                  <div className="flex items-center gap-4 shrink-0 lg:border-r lg:border-border/50 lg:pr-6">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-black tabular-nums tracking-tighter">
                        {format(new Date(apt.appointment_date), "HH:mm")}
                      </p>
                      <Badge variant="outline" className="mt-2 text-[9px] font-black uppercase text-primary border-primary/30">
                        {formatDuration(apt.services?.duration_min)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest", statusConfig.class)}>
                        {statusConfig.label}
                      </Badge>
                      
                      <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-secondary/50 text-muted-foreground">
                        <UserCircle className="mr-1 h-3 w-3" /> {isOwnerOfApt ? "Meu Horário" : professionalName}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight flex items-center gap-2 text-foreground">
                        <User className="h-4 w-4 text-primary" />
                        {clientName}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <Scissors className="h-3.5 w-3.5" />
                          {apt.services?.name} • 
                          <span className="text-primary/80">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.total_price || 0)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:pl-6 border-t border-border/50 lg:border-t-0 pt-4 lg:pt-0">
                    {canManage ? (
                      <>
                        <Button 
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id: apt.id, status: 'completed' })}
                          className="rounded-xl h-10 px-5 text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-none transition-transform active:scale-95"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir
                        </Button>
                        <Button 
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id: apt.id, status: 'cancelled' })}
                          variant="outline"
                          className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest border-destructive/20 text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      !isFinished && (
                        <p className="text-[9px] font-bold uppercase text-muted-foreground italic px-4 py-2 bg-muted/20 rounded-lg border border-border/40">
                          Somente visualização
                        </p>
                      )
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}