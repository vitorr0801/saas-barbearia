"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
// 🗑️ IMPORT APAGADO: import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Landmark, Download, Loader2, Receipt, User, TrendingUp, Calendar as CalendarIcon, ArrowRight, Target
} from "lucide-react";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// 🚀 TIER-1: Importação da Biblioteca Gráfica Padrão Mundial (Recharts)
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

// --- Tipagem do Motor Financeiro ---
type FinancialTransaction = {
  id: string;
  appointment_date: string;
  total_price: number | null;
  commission_value: number | null;
  client: { name: string | null } | null;
  services: { name: string | null; duration_min: number | null } | null;
  professional: { id: string; name: string | null } | null;
};

const formatBRL = (value: number) => 
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Cores para os gráficos (Padrão Cyberpunk/Dark Mode do app)
const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Financial() {
  const { currentUser } = useAuth();
  const barbeariaId = currentUser?.barbearia_id;

  // 🗓️ ESTADO DE INTERVALO
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });

  // 🚀 TIER-1: Estado do Filtro de Profissionais (O "Gestor" em ação)
  const [selectedBarberId, setSelectedBarberId] = useState<string>("all");

  const setQuickRange = (type: "today" | "7days" | "month") => {
    const now = new Date();
    let from = now; let to = now;

    if (type === "today") {
      from = startOfDay(now); to = endOfDay(now);
    } else if (type === "7days") {
      from = subDays(now, 6); to = endOfDay(now);
    } else if (type === "month") {
      from = startOfMonth(now); to = endOfMonth(now);
    }

    setDateRange({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd")
    });
  };

  // 📡 FETCHING GERAL DE TRANSAÇÕES
  const { data: rawTransactions = [], isLoading } = useQuery({
    queryKey: ["financial-ledger", barbeariaId, dateRange.from, dateRange.to],
    queryFn: async (): Promise<FinancialTransaction[]> => {
      if (!barbeariaId) return [];
      const startISO = startOfDay(parseISO(dateRange.from)).toISOString();
      const endISO = endOfDay(parseISO(dateRange.to)).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, appointment_date, total_price, commission_value,
          client:profiles!client_id ( name ),
          services:service_id ( name, duration_min ),
          professional:profiles!professional_id ( id, name )
        `)
        .eq("barbearia_id", barbeariaId)
        .eq("status", "concluido")
        .gte("appointment_date", startISO)
        .lte("appointment_date", endISO)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      return (data as unknown as FinancialTransaction[]) || [];
    },
    enabled: !!barbeariaId,
  });

  // 🧬 MOTOR DE BI (Business Intelligence): Filtra, Agrupa e Calcula
  const { 
    filteredTransactions, 
    metrics, 
    dailyChartData, 
    professionalDistribution,
    professionalList 
  } = useMemo(() => {
    
    // 1. Aplica o Filtro de Profissional (O "Zoom" do Gestor)
    const txs = selectedBarberId === "all" 
      ? rawTransactions 
      : rawTransactions.filter(tx => tx.professional?.id === selectedBarberId);

    // 2. Variáveis de Agregação
    let gross = 0; let comm = 0; let count = 0;
    const byBarber: Record<string, { name: string; amount: number; cuts: number; grossAmount: number }> = {};
    const byDate: Record<string, number> = {};
    const allProfessionalsMap: Record<string, string> = {};

    // 3. Processamento Linha a Linha (Velocidade O(n))
    txs.forEach((tx) => {
      const v = tx.total_price || 0;
      const c = tx.commission_value || 0;
      
      gross += v; 
      comm += c;
      count += 1;

      // Agrupamento por Dia (Para o Gráfico de Evolução)
      const dateKey = format(parseISO(tx.appointment_date), "dd/MM");
      byDate[dateKey] = (byDate[dateKey] || 0) + v;

      // Agrupamento por Barbeiro (Para Repasses e Gráfico de Rosca)
      if (tx.professional?.id) {
        const pId = tx.professional.id;
        const pName = tx.professional.name || "—";
        allProfessionalsMap[pId] = pName; // Guarda para o select

        if (!byBarber[pId]) byBarber[pId] = { name: pName, amount: 0, cuts: 0, grossAmount: 0 };
        byBarber[pId].amount += c;
        byBarber[pId].cuts += 1;
        byBarber[pId].grossAmount += v;
      }
    });

    // Pega a lista de todos os barbeiros *do período inteiro* (mesmo se o filtro estiver ativo)
    rawTransactions.forEach(tx => {
      if (tx.professional?.id) allProfessionalsMap[tx.professional.id] = tx.professional.name || "—";
    });
    
    const pList = Object.entries(allProfessionalsMap).map(([id, name]) => ({ id, name }));

    // 4. Formatação para os Gráficos (Recharts)
    const dChartData = Object.entries(byDate)
      .map(([date, total]) => ({ date, total }))
      .reverse(); // Ordem cronológica
      
    const pDistribution = Object.values(byBarber)
      .map(b => ({ name: b.name, value: b.grossAmount }))
      .sort((a, b) => b.value - a.value); // Ordena do maior pro menor

    return { 
      filteredTransactions: txs,
      metrics: { 
        gross, 
        comm, 
        net: gross - comm, 
        ticketMedio: count > 0 ? gross / count : 0, // 🚀 A Métrica de Ouro
        payouts: Object.values(byBarber) 
      },
      dailyChartData: dChartData,
      professionalDistribution: pDistribution,
      professionalList: pList
    };
  }, [rawTransactions, selectedBarberId]);

  return (
    // 🚀 TAG <AppLayout> REMOVIDA DAQUI
    <div className="container max-w-7xl mx-auto space-y-8 overflow-x-hidden">
      
      {/* EXECUTIVE HEADER */}
      <header className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Landmark className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Performance Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
              Comando <span className="text-primary">Financeiro</span>
            </h1>
          </div>
          
          {/* 🚀 TIER-1: Filtro de Profissionais Global */}
          <div className="flex items-center gap-3">
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-[200px] h-10 rounded-xl bg-card border-border/60 text-xs font-bold uppercase tracking-widest">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                <SelectItem value="all" className="text-xs font-bold uppercase cursor-pointer">
                  <span className="text-primary">✦ Visão Global</span>
                </SelectItem>
                {professionalList.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase cursor-pointer">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="hidden sm:flex rounded-xl font-bold uppercase tracking-widest text-[9px] h-10 px-6 border-border/60 hover:bg-secondary">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        </div>

        {/* SELETOR DE DATAS */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-card/40 p-4 rounded-[2rem] border border-border/40 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Início</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                <Input 
                  type="date" 
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="h-10 w-40 pl-9 pr-3 rounded-xl bg-background border-border/60 focus:ring-primary/20 text-xs font-mono [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-all relative"
                />
              </div>
            </div>
            <div className="pt-5 hidden sm:block">
              <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Fim</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                <Input 
                  type="date" 
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="h-10 w-40 pl-9 pr-3 rounded-xl bg-background border-border/60 focus:ring-primary/20 text-xs font-mono [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-all relative"
                />
              </div>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-border/50 hidden lg:block mx-2" />

          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
            <button onClick={() => setQuickRange("today")} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-colors whitespace-nowrap">Hoje</button>
            <button onClick={() => setQuickRange("7days")} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-colors whitespace-nowrap">7 Dias</button>
            <button onClick={() => setQuickRange("month")} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-colors whitespace-nowrap">Mês Atual</button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Calculando Performance...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* 🚀 TIER-1: METRICS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-sm flex flex-col justify-between h-32">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-primary"/> Faturamento Bruto</p>
              <p className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">{formatBRL(metrics.gross)}</p>
            </Card>

            <Card className="p-5 border-emerald-500/20 bg-emerald-500/5 rounded-[2rem] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5"><Landmark className="w-24 h-24 text-emerald-500"/></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 relative z-10">
                {selectedBarberId === "all" ? "Líquido Barbearia" : "Líquido (Sua Parte)"}
              </p>
              <p className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400 relative z-10">{formatBRL(metrics.net)}</p>
            </Card>

            <Card className="p-5 border-amber-500/20 bg-amber-500/5 rounded-[2rem] shadow-sm flex flex-col justify-between h-32">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                {selectedBarberId === "all" ? "Custo c/ Comissões" : "Comissão do Barbeiro"}
              </p>
              <p className="text-2xl md:text-3xl font-black tracking-tighter text-amber-600 dark:text-amber-400">{formatBRL(metrics.comm)}</p>
            </Card>

            <Card className="p-5 border-blue-500/20 bg-blue-500/5 rounded-[2rem] shadow-sm flex flex-col justify-between h-32 relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5"><Target className="w-3 h-3"/> Ticket Médio (AOV)</p>
              <p className="text-2xl md:text-3xl font-black tracking-tighter text-blue-600 dark:text-blue-400">{formatBRL(metrics.ticketMedio)}</p>
            </Card>
          </div>

          {/* 🚀 TIER-1: VISUAL BI GRAPHS */}
          {filteredTransactions.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-6 pt-2">
              {/* Gráfico de Evolução (Linha) */}
              <Card className="lg:col-span-2 p-6 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-sm min-h-[300px]">
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Evolução do Caixa</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Ritmo de faturamento no período</p>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                      <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#11141d', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value: number) => [formatBRL(value), 'Faturamento']}
                      />
                      <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#11141d" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Gráfico de Distribuição (Aparece só na Visão Global) */}
              {selectedBarberId === "all" ? (
                <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-sm min-h-[300px] flex flex-col">
                  <div className="mb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Distribuição da Receita</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Quem gerou mais valor bruto</p>
                  </div>
                  <div className="flex-1 min-h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={professionalDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {professionalDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#11141d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(value: number) => formatBRL(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {professionalDistribution.slice(0, 4).map((p, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}/>
                        <span className="truncate">{p.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                // Card alternativo quando filtrado por barbeiro (Mostra o Resumo Operacional dele)
                <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-sm min-h-[300px] flex flex-col justify-center items-center text-center">
                  <User className="w-12 h-12 text-primary/20 mb-4" />
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-foreground">Raio-X do Profissional</h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    Você está analisando exclusivamente o desempenho deste barbeiro.
                  </p>
                  <div className="mt-6 p-4 rounded-2xl bg-secondary/50 border border-border/50 w-full">
                    <p className="text-[10px] uppercase font-black tracking-widest text-primary mb-1">Total de Serviços Executados</p>
                    <p className="text-2xl font-black">{filteredTransactions.length}</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TABELAS DE DETALHAMENTO */}
          <Tabs defaultValue="list" className="w-full pt-4">
            <TabsList className="h-12 bg-secondary/50 rounded-2xl border border-border p-1 mb-6 inline-flex max-w-full overflow-x-auto no-scrollbar">
              <TabsTrigger value="list" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-8 data-[state=active]:bg-background whitespace-nowrap">
                <Receipt className="w-3.5 h-3.5 mr-2" /> Extrato Detalhado
              </TabsTrigger>
              {selectedBarberId === "all" && (
                <TabsTrigger value="payouts" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-8 data-[state=active]:bg-background whitespace-nowrap">
                  <User className="w-3.5 h-3.5 mr-2" /> Fechamento da Equipe
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="list">
              <Card className="border-border/40 bg-card/30 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/50">
                      <tr>
                        <th className="px-6 py-4">Data / Hora</th>
                        <th className="px-6 py-4">Cliente & Serviço</th>
                        <th className="px-6 py-4">Profissional</th>
                        <th className="px-6 py-4 text-right">Detalhamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-40">
                            Nenhuma transação encontrada no filtro.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-foreground">{format(new Date(tx.appointment_date), "dd/MM/yyyy")}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(tx.appointment_date), "HH:mm")}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-foreground">{tx.client?.name || "Avulso"}</p>
                              <p className="text-xs text-muted-foreground">{tx.services?.name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary uppercase bg-primary/5">
                                {tx.professional?.name}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-end gap-1.5 font-bold text-[10px]">
                                <div className="flex justify-between w-32 text-emerald-500">
                                  <span className="uppercase opacity-70">Casa:</span>
                                  <span>{formatBRL((tx.total_price || 0) - (tx.commission_value || 0))}</span>
                                </div>
                                <div className="flex justify-between w-32 text-amber-500">
                                  <span className="uppercase opacity-70">Barbeiro:</span>
                                  <span>{formatBRL(tx.commission_value || 0)}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Aba de Payouts (Só aparece se a visão for Global) */}
            {selectedBarberId === "all" && (
              <TabsContent value="payouts">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {metrics.payouts.map((payout, idx) => (
                    <Card key={idx} className="bg-card/40 border-border/50 rounded-3xl p-6 hover:border-primary/40 transition-all group">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="font-black text-sm uppercase italic">{payout.name}</h3>
                        </div>
                        <Badge className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black">{payout.cuts} Cortes</Badge>
                      </div>
                      <div className="pt-4 border-t border-border flex flex-col gap-1">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Valor a Pagar (Sexta-feira)</span>
                        <span className="text-2xl font-black text-amber-500 tabular-nums">{formatBRL(payout.amount)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}