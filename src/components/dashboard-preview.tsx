"use client"

import { TrendingUp, DollarSign, Users, Calendar } from "lucide-react"

const metrics = [
  {
    label: "Faturamento mensal",
    value: "R$ 28.450",
    change: "+12%",
    icon: DollarSign
  },
  {
    label: "Ticket médio",
    value: "R$ 85",
    change: "+8%",
    icon: TrendingUp
  },
  {
    label: "Clientes ativos",
    value: "342",
    change: "+15%",
    icon: Users
  },
  {
    label: "Agendamentos/mês",
    value: "486",
    change: "+22%",
    icon: Calendar
  }
]

const chartData = [
  { month: "Jan", value: 65 },
  { month: "Fev", value: 72 },
  { month: "Mar", value: 68 },
  { month: "Abr", value: 85 },
  { month: "Mai", value: 92 },
  { month: "Jun", value: 100 }
]

export function DashboardPreview() {
  const maxValue = Math.max(...chartData.map(d => d.value))

  return (
    <section className="py-24 px-4" id="dashboard">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Dashboard
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Métricas que impulsionam seu lucro
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Acompanhe em tempo real todos os números importantes do seu negócio
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
          
          <div className="relative bg-card border border-border rounded-2xl p-6 md:p-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Visão geral</h3>
                <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>+18% vs mês anterior</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-background border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <metric.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-primary font-medium">{metric.change}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="p-6 rounded-xl bg-background border border-border">
              <h4 className="text-sm font-medium text-foreground mb-6">Crescimento mensal</h4>
              <div className="flex items-end justify-between gap-2 h-40">
                {chartData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative flex-1 flex items-end">
                      <div
                        className="w-full bg-primary/80 rounded-t-md transition-all duration-500 hover:bg-primary"
                        style={{ height: `${(data.value / maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
