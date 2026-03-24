"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Calendar, MessageCircle, TrendingUp, ArrowRight, Scissors, LayoutDashboard, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export const HeroSection = React.memo(() => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, role, currentUser } = useAuth()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleNavigation = useCallback((path: string) => {
    navigate(path)
  }, [navigate])

  // 🔀 Estratégia de Conversão Bifurcada
  const ctaContent = useMemo(() => {
    if (!isAuthenticated) {
      return {
        primary: {
          label: "SOU BARBEIRO: GESTÃO DE ELITE",
          desc: "Quero profissionalizar meu negócio hoje",
          path: "/cadastro",
          icon: <TrendingUp className="w-5 h-5" />
        },
        secondary: {
          label: "SOU CLIENTE: AGENDAR CORTE",
          desc: "Reservar meu horário em 30 segundos",
          path: "/cadastro", // Redireciona para cadastro/login antes de agendar
          icon: <Calendar className="w-5 h-5" />
        }
      }
    }

    if (role === "barbeiro") {
      return {
        primary: {
          label: "ACESSAR MEU DASHBOARD",
          desc: "Ver faturamento e métricas de lucro",
          path: "/dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />
        },
        secondary: {
          label: "GERENCIAR AGENDA",
          desc: "Ver próximos clientes e horários",
          path: "/agendamentos",
          icon: <Calendar className="w-5 h-5" />
        }
      }
    }

    return {
      primary: {
        label: "AGENDAR NOVO SERVIÇO",
        desc: "Encontrar minha barbearia favorita",
        path: "/descobrir",
        icon: <Scissors className="w-5 h-5" />
      },
      secondary: {
        label: "MEUS AGENDAMENTOS",
        desc: "Ver e gerenciar horários marcados",
        path: "/meus-agendamentos",
        icon: <Calendar className="w-5 h-5" />
      }
    }
  }, [isAuthenticated, role])

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center px-4 py-20 overflow-hidden bg-background">
      {/* ⚡ Background Otimizado */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.2) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div
          className={cn(
            "transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
        >
          {/* Badge Dinâmica de Elite */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-secondary/50 border border-border/50 mb-10 backdrop-blur-md shadow-inner">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
              {isAuthenticated 
                ? `OPERANDO EM MODO ELITE: ${currentUser?.name.split(' ')[0]}` 
                : "BARBERPRO SECURITY PROTOCOL V3.0"}
            </span>
          </div>

          {/* Headline Polimórfica com Estilo BarberPro */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-8 text-balance leading-[0.85] text-foreground">
            LUCRO <span className="text-primary">AFIADO</span>,<br />
            GESTÃO <span className="text-primary">PRECISA.</span>
          </h1>

          {/* Subheadline Reativa */}
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-medium uppercase tracking-tight">
            {role === 'barbeiro' 
              ? "Assuma o controle total da sua bancada. Acompanhe seu crescimento real e gerencie sua equipe com a melhor tecnologia do mercado."
              : "Estilo de elite ao alcance de um toque. Agende seu horário, receba lembretes automáticos e nunca mais perca seu barbeiro favorito."}
          </p>

          {/* 🔀 CTAs de Alta Conversão */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mb-24 max-w-4xl mx-auto">
            {/* Botão Primário (Ouro/Primary) */}
            <button 
              onClick={() => handleNavigation(ctaContent.primary.path)}
              className="group relative flex flex-col items-center gap-1 px-10 py-6 bg-primary text-primary-foreground rounded-3xl transition-all hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(245,158,11,0.3)] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 font-black text-2xl italic uppercase tracking-tighter">
                {ctaContent.primary.icon}
                {ctaContent.primary.label}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
              <span className="text-[10px] opacity-70 font-black uppercase tracking-widest">{ctaContent.primary.desc}</span>
            </button>

            {/* Botão Secundário (Sóbrio) */}
            <button 
              onClick={() => handleNavigation(ctaContent.secondary.path)}
              className="group flex flex-col items-center gap-1 px-10 py-6 bg-card border border-border rounded-3xl transition-all hover:bg-secondary hover:border-primary/40 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 font-black text-2xl italic uppercase tracking-tighter text-foreground">
                {ctaContent.secondary.icon}
                {ctaContent.secondary.label}
              </div>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{ctaContent.secondary.desc}</span>
            </button>
          </div>

          {/* Trust Badges - Mini Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto opacity-80">
            {[
              { icon: MessageCircle, text: "Lembretes Automáticos" },
              { icon: Calendar, text: "Agenda Inteligente 24/7" },
              { icon: TrendingUp, text: "Relatórios de Faturamento" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/40 backdrop-blur-sm">
                <feature.icon className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
})

HeroSection.displayName = "HeroSection"