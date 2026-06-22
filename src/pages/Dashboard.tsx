"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
// 🗑️ IMPORT APAGADO: import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, 
  Receipt, 
  Activity, 
  Clock, 
  Wallet,
  Scissors,
  Store,
  Coffee,
  Share2,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { startOfMonth, endOfMonth, format, isToday, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";

// --- Tipagem Blindada ---
type DashboardAppointment = {
  id: string;
  appointment_date: string;
  status: string;
  total_price: number | null;
  commission_value: number | null;
  professional: { name: string } | null;
  service_name?: string;
};

// ⏱️ Motor de Formatação de Tempo Humano (Tier-1)
function formatTimeHumanized(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} minuto${totalMinutes === 1 ? '' : 's'}`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hourStr = `${hours} hora${hours === 1 ? '' : 's'}`;
  const minStr = mins > 0 ? ` e ${mins} minuto${mins === 1 ? '' : 's'}` : '';
  return `${hourStr}${minStr}`;
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [nowRealtime, setNowRealtime] = useState(new Date());
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Atualiza o relógio a cada minuto para o card dinâmico
  useEffect(() => {
    const timer = setInterval(() => setNowRealtime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const firstName = currentUser?.name?.split(/\s+/)[0] ?? "Profissional";
  const isAdmin = Boolean(currentUser?.is_admin);
  const barbeariaId = currentUser?.barbearia_id;
  const userId = currentUser?.id;

  const monthStart = startOfMonth(nowRealtime).toISOString();
  const monthEnd = endOfMonth(nowRealtime).toISOString();

  // 🚀 Fetch 1: Nome da Barbearia
  const { data: barbeariaName = "Sua Barbearia" } = useQuery({
    queryKey: ["barbearia-name", barbeariaId],
    queryFn: async () => {
      if (!barbeariaId) return "Sua Barbearia";
      const { data, error } = await supabase
        .from('barbearias')
        .select('name')
        .eq('id', barbeariaId)
        .maybeSingle();

      if (error) {
        console.error("[Dashboard] Erro ao buscar nome da barbearia:", error);
        return "Sua Barbearia";
      }
      return data?.name || "Sua Barbearia";
    },
    enabled: !!barbeariaId,
    staleTime: 1000 * 60 * 60,
  });

  // 🚀 Fetch 2: Agendamentos do Mês
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["dashboard-metrics", barbeariaId, monthStart],
    queryFn: async () => {
      if (!barbeariaId) return [];

      let q = supabase
        .from("appointments")
        .select(`
          id, appointment_date, status, total_price, commission_value, service_name,
          professional:profiles!professional_id ( name )
        `)
        .eq("barbearia_id", barbeariaId)
        .gte("appointment_date", monthStart)
        .lte("appointment_date", monthEnd)
        .not("status", "eq", "cancelado");

      if (!isAdmin) {
        q = q.eq("professional_id", userId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as DashboardAppointment[];
    },
    enabled: !!barbeariaId,
    staleTime: 1000 * 60 * 5, 
  });

  // 🧠 Motor de Cálculo
  const metrics = useMemo(() => {
    let todayRevenue = 0;
    let todayCommissions = 0;
    let todayCompletedCount = 0;
    let todayTotalAppointments = 0;
    
    const barberRanking: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};
    const upcomingAppointments: DashboardAppointment[] = [];

    const startOfToday = new Date(nowRealtime);
    startOfToday.setHours(0, 0, 0, 0);

    appointments.forEach((apt) => {
      const aptDate = new Date(apt.appointment_date);
      const isAptToday = isToday(aptDate);
      const isCompleted = ["concluido", "completed"].includes(apt.status?.toLowerCase() || "");
      const value = apt.total_price || 0;
      const commission = apt.commission_value || 0;

      const dayKey = format(aptDate, "dd/MM");
      if (!revenueByDay[dayKey]) revenueByDay[dayKey] = 0;
      if (isCompleted) {
        revenueByDay[dayKey] += isAdmin ? value : commission;
      }

      if (!isCompleted && aptDate >= startOfToday) {
        upcomingAppointments.push(apt);
      }

      if (isAptToday) {
        todayTotalAppointments++;

        if (isCompleted) {
          todayCompletedCount++;
          todayRevenue += value;
          todayCommissions += commission;
          
          if (isAdmin && apt.professional?.name) {
            const bName = apt.professional.name;
            barberRanking[bName] = (barberRanking[bName] || 0) + value;
          }
        }
      }
    });

    upcomingAppointments.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

    const topBarber = Object.entries(barberRanking).sort((a, b) => b[1] - a[1])[0];
    const chartData = Object.entries(revenueByDay)
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => {
        const [d1, m1] = a.day.split('/');
        const [d2, m2] = b.day.split('/');
        return new Date(nowRealtime.getFullYear(), Number(m1)-1, Number(d1)).getTime() - 
               new Date(nowRealtime.getFullYear(), Number(m2)-1, Number(d2)).getTime();
      });

    return {
      todayRevenue,
      todayCommissions,
      todayTicket: todayCompletedCount > 0 ? todayRevenue / todayCompletedCount : 0,
      todayOccupancy: todayTotalAppointments,
      todayCompletedCount,
      topBarberName: topBarber ? topBarber[0] : "Sem dados",
      chartData,
      nextAppointment
    };
  }, [appointments, isAdmin, nowRealtime]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/agendar/${barbeariaId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de agendamento copiado!", {
      description: "Envie para seus clientes no WhatsApp ou Instagram."
    });
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    setIsCompleting(true);
    const toastId = toast.loading("Concluindo atendimento...");
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'concluido' })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      toast.success("Atendimento concluído com sucesso!", { 
        id: toastId,
        description: "Suas métricas foram atualizadas." 
      });
      
      await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      
    } catch (e) {
      console.error("[Concluir Atendimento]:", e);
      toast.error("Erro ao concluir.", { id: toastId, description: "Tente novamente." });
    } finally {
      setIsCompleting(false);
    }
  };

  // 🎨 Motor de UX para o Status do Próximo Atendimento
  const renderNextAppointmentStatus = () => {
    if (!metrics.nextAppointment) return null;

    const aptDate = new Date(metrics.nextAppointment.appointment_date);
    const diffMins = differenceInMinutes(aptDate, nowRealtime);
    const absDiff = Math.abs(diffMins);

    // Passou do horário
    if (diffMins < 0) {
      if (absDiff < 60) {
        return (
          <p className="text-sm text-amber-500 font-semibold mt-1 flex items-center gap-1.5 animate-pulse">
            <Activity className="w-4 h-4" /> Em andamento (iniciou há {formatTimeHumanized(absDiff)})
          </p>
        );
      } else {
        return (
          <p className="text-sm text-red-500 font-semibold mt-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Pendente / Atrasado (passou {formatTimeHumanized(absDiff)})
          </p>
        );
      }
    }

    // Janela de Ação (15 minutos antes)
    if (diffMins >= 0 && diffMins <= 15) {
      return (
        <p className="text-sm text-primary font-semibold mt-1 flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> O cliente já pode ter chegado ({diffMins === 0 ? "Agora" : `em ${formatTimeHumanized(diffMins)}`})
        </p>
      );
    }

    // Futuro Distante
    return (
      <p className="text-sm text-muted-foreground mt-1">
        Faltam <strong className="text-foreground">{formatTimeHumanized(diffMins)}</strong> • Previsão: {formatCurrency(metrics.nextAppointment.total_price || 0)}
      </p>
    );
  };

  return (
    // 🚀 TAG <AppLayout> REMOVIDA PARA O CONTEÚDO FLUIR NA SIDEBAR
    <div className="container max-w-7xl mx-auto space-y-8">
      
      {/* 🏁 HEADER INTELIGENTE */}
      <header className="animate-in fade-in slide-in-from-left-4 duration-500 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Store className="w-3 h-3 text-primary" />
            {barbeariaName}
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-foreground">
            Olá, <span className="text-primary">{firstName}</span>.
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isAdmin ? "Visão Estratégica da Barbearia" : "Seu painel de desempenho"}
          </p>
        </div>
      </header>

      {/* ⚡ ZONA DE AÇÃO: PRÓXIMO ATENDIMENTO */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        {metrics.nextAppointment ? (
          <Card className={cn(
            "p-1 rounded-[2rem] shadow-lg overflow-hidden relative transition-all duration-500",
            differenceInMinutes(new Date(metrics.nextAppointment.appointment_date), nowRealtime) < 0 
              ? "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-background to-background" 
              : "border-primary/30 bg-gradient-to-r from-primary/10 via-background to-background"
          )}>
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[2rem]",
              differenceInMinutes(new Date(metrics.nextAppointment.appointment_date), nowRealtime) < 0 ? "bg-amber-500" : "bg-primary"
            )} />
            
            <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5",
                  differenceInMinutes(new Date(metrics.nextAppointment.appointment_date), nowRealtime) < 0 ? "text-amber-500" : "text-primary"
                )}>
                  <Clock className="w-3 h-3" />
                  Atendimento Atual / Próximo
                </p>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                  {metrics.nextAppointment.service_name || "Serviço"} às {format(new Date(metrics.nextAppointment.appointment_date), "HH:mm")}
                </h3>
                
                {renderNextAppointmentStatus()}
              </div>
              
              {/* 🚀 Botões de Ação com Antecipação de 15 Minutos */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                {differenceInMinutes(new Date(metrics.nextAppointment.appointment_date), nowRealtime) <= 15 ? (
                  <>
                    <Button 
                      onClick={() => handleCompleteAppointment(metrics.nextAppointment!.id)}
                      disabled={isCompleting}
                      className="rounded-full font-bold uppercase tracking-wider text-xs shadow-md bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto"
                    >
                      {isCompleting ? "Processando..." : <><CheckCircle2 className="w-4 h-4 mr-2" /> Concluir Atendimento</>}
                    </Button>
                    <Button 
                      onClick={() => navigate('/agendamentos')} 
                      variant="outline"
                      className="rounded-full font-bold uppercase tracking-wider text-xs shadow-sm w-full sm:w-auto"
                    >
                      Ver Detalhes
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate('/agendamentos')} 
                    className="rounded-full font-bold uppercase tracking-wider text-xs shadow-md w-full sm:w-auto"
                  >
                    Ir para Agenda <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

            </div>
          </Card>
        ) : (
          <Card className="p-6 border-dashed border-border/60 bg-card/20 rounded-[2rem] flex items-center justify-center gap-3 text-muted-foreground">
            <Coffee className="w-5 h-5 text-primary/70" />
            <p className="text-sm font-semibold tracking-wide">
              Sua agenda está livre por agora. Aproveite para tomar um café!
            </p>
          </Card>
        )}
      </div>

      {/* 🏆 NORTH STAR METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        
        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
            {isAdmin ? <DollarSign className="h-16 w-16 text-primary" /> : <Wallet className="h-16 w-16 text-emerald-500" />}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 relative z-10">
            {isAdmin ? "Faturamento Hoje" : "Sua Comissão Hoje"}
          </p>
          <p className="text-4xl font-black tracking-tighter text-foreground relative z-10">
            {formatCurrency(isAdmin ? metrics.todayRevenue : metrics.todayCommissions)}
          </p>
        </Card>

        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
            {isAdmin ? <Receipt className="h-16 w-16 text-primary" /> : <Scissors className="h-16 w-16 text-primary" />}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 relative z-10">
            {isAdmin ? "Ticket Médio (Hoje)" : "Cortes Concluídos"}
          </p>
          <p className="text-4xl font-black tracking-tighter text-foreground relative z-10">
            {isAdmin ? formatCurrency(metrics.todayTicket) : metrics.todayCompletedCount}
          </p>
        </Card>

        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
            <Activity className="h-16 w-16 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 relative z-10">
            Total de Agendamentos (Hoje)
          </p>
          <p className="text-4xl font-black tracking-tighter text-foreground relative z-10">
            {metrics.todayOccupancy}
          </p>
        </Card>

        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden group bg-gradient-to-br from-primary/5 to-transparent">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
            <Clock className="h-16 w-16 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 relative z-10">
            {isAdmin ? "Destaque do Dia" : "Cortes Pendentes"}
          </p>
          <p className="text-2xl font-black uppercase italic tracking-tighter text-foreground relative z-10 truncate mt-2">
            {isAdmin ? metrics.topBarberName : (metrics.todayOccupancy - metrics.todayCompletedCount)}
          </p>
        </Card>
      </div>

      {/* 📊 GRÁFICO: Performance Mensal Dinâmica */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <Card className="p-6 md:p-8 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-tighter text-foreground">
                {isAdmin ? "Receita Mensal" : "Meu Crescimento"}
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {format(nowRealtime, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {isLoading && (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          
          <div className="h-[300px] w-full">
            {metrics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.chartData}>
                  <XAxis 
                    dataKey="day" 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    fontWeight="bold"
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `R$ ${value}`}
                    fontWeight="bold"
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '1rem', border: '1px solid hsl(var(--border))', fontWeight: 'bold' }}
                    formatter={(value: number) => [formatCurrency(value), isAdmin ? "Receita" : "Comissão"]}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {metrics.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 p-6 text-center">
                <Activity className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                  {isLoading ? "Processando dados..." : "Nenhum faturamento registrado neste mês"}
                </p>
                {!isLoading && (
                  <Button onClick={handleCopyLink} variant="outline" className="rounded-full border-primary/50 hover:bg-primary/10 text-primary transition-all">
                    <Share2 className="w-4 h-4 mr-2" /> Compartilhar meu link de agendamento
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}