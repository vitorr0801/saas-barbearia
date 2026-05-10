"use client"

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { 
  Calendar, 
  Clock, 
  Scissors, 
  Inbox, 
  ArrowLeft, 
  User, 
  XCircle, 
  AlertCircle, 
  History, 
  CalendarCheck 
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function MyAppointments() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [aptToCancel, setAptToCancel] = useState<{ id: string, name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

  // 📡 BUSCA DE DADOS
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["appointments", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          profiles!client_id (
            name,
            phone
          ),
          services:service_id ( name ),
          professional:profiles!professional_id ( name )
        `)
        .eq("client_id", currentUser.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // 🚀 LÓGICA DE TEMPO E STATUS MUNDIAL
  const { upcoming, history } = useMemo(() => {
    const now = new Date();
    
    // Funções auxiliares para avaliar com precisão e blindar variações no banco
    const isCompleted = (status: string) => ["concluido", "completed"].includes(status?.toLowerCase());
    const isCanceled = (status: string) => ["cancelado", "canceled", "cancelled"].includes(status?.toLowerCase());

    return {
      upcoming: appointments.filter((apt: any) => 
        // Pra ser "Próximo" NÃO pode estar concluído, NÃO pode estar cancelado E a data tem que ser no futuro
        !isCanceled(apt.status) && !isCompleted(apt.status) && new Date(apt.appointment_date) >= now
      ),
      history: appointments.filter((apt: any) => 
        // Se cancelou OU se o barbeiro apertou concluir OU se a data já expirou, joga no histórico
        isCanceled(apt.status) || isCompleted(apt.status) || new Date(apt.appointment_date) < now
      ).reverse()
    };
  }, [appointments]);

  const currentList = activeTab === "upcoming" ? upcoming : history;

  const openCancelModal = (id: string, serviceName: string) => {
    setAptToCancel({ id, name: serviceName });
    setIsCancelModalOpen(true);
  };

  const processCancel = async () => {
    if (!aptToCancel) return;
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: 'canceled' })
        .eq('id', aptToCancel.id)
        .eq('client_id', currentUser?.id);

      if (error) throw error;
      toast({ title: "Corte Cancelado ❌", description: "O horário foi liberado na agenda." });
      setIsCancelModalOpen(false);
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao cancelar", description: error.message });
    }
  };

  // UI Engine: Gera as cores de Tag Dinamicamente baseada na verdade do banco
  const getStatusTag = (apt: any, isPastTime: boolean) => {
    const status = apt.status?.toLowerCase();
    if (["cancelado", "canceled", "cancelled"].includes(status)) {
      return { text: "Cancelado", class: "bg-destructive/10 text-destructive border-destructive/20" };
    }
    if (["concluido", "completed"].includes(status) || isPastTime) {
      return { text: "Concluído", class: "bg-muted text-muted-foreground border-border" };
    }
    if (status === "pending") {
      return { text: "Pendente", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    }
    return { text: "Confirmado", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container pt-24 py-8 max-w-4xl space-y-8">
        
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-foreground">
                Minha Agenda
              </h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                Gerencie seus horários de elite
              </p>
            </div>
          </div>

          <div className="flex p-1 bg-secondary/50 rounded-2xl border border-border w-full max-w-sm">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === "upcoming" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarCheck className="w-3 h-3" /> Próximos ({upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === "history" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="w-3 h-3" /> Histórico
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-card animate-pulse rounded-[2rem] border border-border" />)}
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
              <Inbox className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <div>
              <h2 className="text-xl font-bold italic uppercase">
                {activeTab === "upcoming" ? "Nenhum agendamento ativo" : "Histórico vazio"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === "upcoming" ? "Você não tem cortes marcados para os próximos dias." : "Você ainda não concluiu ou cancelou nenhum corte."}
              </p>
            </div>
            {activeTab === "upcoming" && (
              <Button onClick={() => navigate("/descobrir")} className="rounded-xl font-bold uppercase italic px-8 h-12 shadow-lg shadow-primary/20">
                Agendar Agora
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {currentList.map((apt: any) => {
              const dateObj = new Date(apt.appointment_date);
              const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
              const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              
              const isPastTime = dateObj < new Date();
              const statusStr = apt.status?.toLowerCase() || '';
              
              // Define logicamente se já é item do passado para a UI bloquear cliques
              const isHistoryItem = isPastTime || ["concluido", "completed", "cancelado", "canceled", "cancelled"].includes(statusStr);
              const isActuallyCanceled = ["cancelado", "canceled", "cancelled"].includes(statusStr);

              const tagConfig = getStatusTag(apt, isPastTime);

              return (
                <div 
                  key={apt.id} 
                  className={cn(
                    "group bg-card border border-border p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all",
                    isHistoryItem ? "opacity-60 grayscale-[50%]" : "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 border-l-4 border-l-primary"
                  )}
                >
                  {/* Bloco 1: Serviço e Profissional */}
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                      isActuallyCanceled ? "bg-destructive/10 text-destructive" : isHistoryItem ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}>
                      <Scissors className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg md:text-xl italic uppercase tracking-tight leading-tight text-foreground">
                        {apt.service_name ?? apt.services?.name ?? "Serviço"}
                      </h3>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <p className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> {apt.professional_name ?? apt.professional?.name ?? "—"}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          R$ {(apt.total_price ?? apt.price)?.toFixed(2)} • {apt.payment_method ?? "Presencial"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bloco 2: Data, Hora e Ações com maior respiro */}
                  <div className="flex flex-col sm:flex-row md:justify-end items-start sm:items-center gap-6 w-full md:w-auto border-t border-border/50 md:border-t-0 pt-6 md:pt-0">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        {isHistoryItem && !isActuallyCanceled ? "Realizado em" : isActuallyCanceled ? "Cancelado em" : "Data e Hora"}
                      </span>
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full border border-border whitespace-nowrap text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> {formattedDate}
                        </div>
                        <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full border border-border text-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary" /> {formattedTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className={cn(
                        "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border w-full sm:w-auto text-center",
                        tagConfig.class
                      )}>
                        {tagConfig.text}
                      </div>

                      {!isHistoryItem ? (
                        <button
                          onClick={() => openCancelModal(apt.id, apt.service_name ?? apt.services?.name ?? "Serviço")}
                          className="text-[10px] font-black uppercase text-muted-foreground hover:text-destructive transition-colors flex justify-center w-full sm:w-auto items-center gap-1.5 mt-1 underline underline-offset-4 decoration-border hover:decoration-destructive/30"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar Horário
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate("/descobrir")}
                          className="text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors flex justify-center w-full sm:w-auto items-center mt-1 underline underline-offset-4 decoration-primary/20"
                        >
                          Agendar novamente
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 🛡️ MODAL DE CONFIRMAÇÃO */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsCancelModalOpen(false)} />
          <div className="relative bg-card border border-border p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Confirmar?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O serviço de <span className="text-foreground font-bold">{aptToCancel?.name}</span> será cancelado e o horário liberado.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button variant="destructive" className="rounded-2xl font-black uppercase italic h-14 shadow-lg text-lg active:scale-95" onClick={processCancel}>
                  Sim, cancelar
                </Button>
                <Button variant="ghost" className="rounded-2xl font-bold uppercase text-[10px] tracking-widest opacity-60" onClick={() => setIsCancelModalOpen(false)}>
                  Manter horário
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}