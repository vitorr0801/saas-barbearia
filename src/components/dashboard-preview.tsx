"use client"

import React from "react"
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from "recharts"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Zap,
  Target
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

// 🚀 TIER-1: Métricas baseadas no Desejo Real do Barbeiro (Previsibilidade e Lucro)
const metrics = [
  { label: "Faturamento Atual", value: "R$ 28.450", change: "+12.5%", icon: DollarSign },
  { label: "Ticket Médio", value: "R$ 85,00", change: "+8.2%", icon: TrendingUp },
  { label: "Clientes Retidos", value: "342", change: "+15%", icon: Users },
  { label: "Previsão de Fechamento", value: "R$ 32.100", change: "Alta", icon: Target }
]

interface TooltipPayload { value: number; name: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayload[]; }

// Tooltip Personalizado para o Gráfico (Design Limpo e Premium)
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-primary/30 p-4 rounded-xl shadow-2xl shadow-primary/10">
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-primary/5 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header da Seção */}
        <div className="text-center mb-16 md:mb-20 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary fill-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inteligência de Negócio</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-foreground leading-[0.9]">
            MÉTRICAS QUE <br />
            <span className="text-primary">GERAM LUCRO REAL.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs md:text-sm font-bold uppercase tracking-widest opacity-80 leading-relaxed mt-4">
            Pare de adivinhar. Tenha clareza absoluta sobre o crescimento da sua barbearia com dados atualizados em tempo real.
          </p>
        </div>

        {/* 🚀 TIER-1: Mockup do Dashboard (Realismo e Imersão) */}
        <div className="relative bg-[#11141d]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-10 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/5">
          
          {/* Header Interno do App (Janela de Navegador/OS) */}
          <div className="flex items-center justify-between mb-8 md:mb-12 border-b border-white/5 pb-6 md:pb-8">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm" />
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-black/20 rounded-md border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  BarberPro • Visão Geral
                </span>
              </div>
            </div>
            
            {/* Indicador Live */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-emerald-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                Dados ao Vivo
              </span>
            </div>
          </div>

          {/* Cards de Métricas (Interativos visualmente) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            {metrics.map((m, i) => (
              <div key={i} className="p-5 md:p-6 rounded-[1.5rem] bg-black/20 border border-white/5 group hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-default hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors duration-300">
                    <m.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">{m.change}</span>
                </div>
                <p className="text-2xl md:text-3xl font-black italic tracking-tighter text-foreground group-hover:text-white transition-colors">
                  {m.value}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-2">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          {/* ÁREA DO GRÁFICO (Populado e Vibrante) */}
          <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-black/20 border border-white/5 h-[300px] md:h-[400px]">
            <h4 className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 md:mb-8 flex items-center gap-2">
              Performance de Faturamento <span className="text-primary/50">• 2026</span>
            </h4>
            <div className="w-full h-[calc(100%-2rem)]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#8b8d9b', fontSize: 10, fontWeight: 'bold'}}
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={['dataMin - 2000', 'dataMax + 2000']} 
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}