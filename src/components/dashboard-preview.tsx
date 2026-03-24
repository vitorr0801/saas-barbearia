"use client"

import React from "react"
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer as ChartContainer
} from "recharts"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Zap, 
  ArrowUpRight 
} from "lucide-react"
import { cn } from "@/lib/utils"

// 📈 DADOS REAIS PARA O GRÁFICO (Tendência de crescimento BarberPro)
const chartData = [
  { month: "Jan", revenue: 18400 },
  { month: "Fev", revenue: 20200 },
  { month: "Mar", revenue: 19800 },
  { month: "Abr", revenue: 23500 },
  { month: "Mai", revenue: 26100 },
  { month: "Jun", revenue: 28450 }, // Valor final que bate com o card
]

const metrics = [
  { label: "Faturamento Mensal", value: "R$ 28.450", change: "+12.5%", icon: DollarSign },
  { label: "Ticket Médio", value: "R$ 85,00", change: "+8.2%", icon: TrendingUp },
  { label: "Clientes Ativos", value: "342", change: "+15%", icon: Users },
  { label: "Agendamentos/Mês", value: "486", change: "+22%", icon: Calendar }
]

// Tooltip Personalizado para o Gráfico
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-primary/20 p-4 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Faturamento</p>
        <p className="text-xl font-black italic text-primary">
          {`R$ ${payload[0].value.toLocaleString('pt-BR')}`}
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardPreview() {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden" id="dashboard">
      {/* Glow de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header da Seção */}
        <div className="text-center mb-20 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inteligência de Negócio</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground leading-[0.9]">
            MÉTRICAS QUE <br />
            <span className="text-primary">GERAM LUCRO REAL.</span>
          </h2>
        </div>

        {/* Mockup do Dashboard */}
        <div className="relative bg-card/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-hidden">
          
          {/* Header Interno do App */}
          <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/20" />
                <div className="w-3 h-3 rounded-full bg-primary/20" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
              </div>
              <h3 className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                BarberPro OS v3.0 • Live Dashboard
              </h3>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
              +18.4% vs mês anterior
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {metrics.map((m, i) => (
              <div key={i} className="p-6 rounded-3xl bg-background/40 border border-white/5 group hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-secondary/50 text-muted-foreground group-hover:text-primary transition-colors">
                    <m.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold">{m.change}</span>
                </div>
                <p className="text-2xl font-black italic tracking-tighter text-foreground">{m.value}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* ÁREA DO GRÁFICO (Populado e Vibrante) */}
          <div className="p-8 rounded-[2rem] bg-background/30 border border-white/5 h-[400px]">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-8">Performance de Faturamento</h4>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#a8aabc', fontSize: 10, fontWeight: 'bold'}}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}