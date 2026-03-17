"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Calendar, MessageCircle, TrendingUp, ArrowRight, Scissors, LayoutDashboard } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

// 🚀 Otimização: React.memo evita re-renders se o componente pai mudar, 
// economizando memória e ciclos de processamento.
export const HeroSection = React.memo(() => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, role, currentUser } = useAuth()

  useEffect(() => {
    // Layout Stability: Ativa a visibilidade após o primeiro commit para evitar CLS (Cumulative Layout Shift)
    setIsVisible(true)
  }, [])

  // 🛡️ Otimização: useCallback garante que a função não seja recriada em cada render,
  // mantendo a estabilidade das referências de memória.
  const handleNavigation = useCallback((path: string) => {
    navigate(path)
  }, [navigate])

  // 🔀 A Mágica da Bifurcação (Dual CTA Strategy):
  // useMemo calcula os botões apenas quando o status de login ou role muda.
  const ctaContent = useMemo(() => {
    if (!isAuthenticated) {
      return {
        primary: {
          label: "Sou Barbeiro: Gestão & Lucro",
          desc: "Quero profissionalizar meu negócio",
          path: "/cadastro",
          icon: <TrendingUp className="w-5 h-5" />
        },
        secondary: {
          label: "Sou Cliente: Agendar Corte",
          desc: "Quero reservar um horário agora",
          path: "/agendar",
          icon: <Calendar className="w-5 h-5" />
        }
      }
    }

    if (role === "barbeiro") {
      return {
        primary: {
          label: "Acessar Meu Dashboard",
          desc: "Ver faturamento e métricas",
          path: "/dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />
        },
        secondary: {
          label: "Gerenciar Agenda",
          desc: "Ver próximos clientes",
          path: "/agendamentos",
          icon: <Calendar className="w-5 h-5" />
        }
      }
    }

    return {
      primary: {
        label: "Agendar Novo Serviço",
        desc: "Encontrar minha barbearia",
        path: "/agendar",
        icon: <Scissors className="w-5 h-5" />
      },
      secondary: {
        label: "Meus Agendamentos",
        desc: "Ver horários marcados",
        path: "/perfil/cliente",
        icon: <Calendar className="w-5 h-5" />
      }
    }
  }, [isAuthenticated, role])

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden bg-background">
      {/* ⚡ Performance: Background otimizado via CSS puro (GPU accelerated) */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div
          className={cn(
            "transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
        >
          {/* Badge Dinâmica */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest">
              {isAuthenticated ? `Bem-vindo de volta, ${currentUser?.name.split(' ')[0]}` : "Plataforma de Elite para Barbearias"}
            </span>
          </div>

          {/* Headline Polimórfica */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 text-balance leading-[1.1]">
            <span className="text-foreground">Lucro afiado,</span>
            <br />
            <span className="text-primary drop-shadow-sm">gestão precisa.</span>
          </h1>

          {/* Subheadline Reativa */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-pretty">
            {role === 'barbeiro' 
              ? "Sua barbearia na palma da mão. Acompanhe seu crescimento e gerencie sua equipe com precisão cirúrgica."
              : "Agende seu estilo em segundos. Escolha seu barbeiro favorito e receba lembretes automáticos via WhatsApp."}
          </p>

          {/* 🔀 A Bifurcação de CTAs (Foco em Conversão) */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mb-20 max-w-3xl mx-auto">
            {/* Botão Primário */}
            <button 
              onClick={() => handleNavigation(ctaContent.primary.path)}
              className="group relative flex flex-col items-center gap-1 px-8 py-5 bg-primary text-primary-foreground rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 font-bold text-xl">
                {ctaContent.primary.icon}
                {ctaContent.primary.label}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-xs opacity-80 font-medium">{ctaContent.primary.desc}</span>
            </button>

            {/* Botão Secundário */}
            <button 
              onClick={() => handleNavigation(ctaContent.secondary.path)}
              className="group flex flex-col items-center gap-1 px-8 py-5 bg-card border border-border rounded-2xl transition-all hover:bg-secondary hover:border-primary/30 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 font-bold text-xl text-foreground">
                {ctaContent.secondary.icon}
                {ctaContent.secondary.label}
              </div>
              <span className="text-xs text-muted-foreground font-medium">{ctaContent.secondary.desc}</span>
            </button>
          </div>

          {/* Mini Features com Cache Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: MessageCircle, text: "Lembretes WhatsApp" },
              { icon: Calendar, text: "Agendamento Inteligente" },
              { icon: TrendingUp, text: "Dashboard de Lucro" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/40 backdrop-blur-[2px] hover:bg-card/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
})

HeroSection.displayName = "HeroSection"