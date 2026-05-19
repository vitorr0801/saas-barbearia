"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Calendar, MessageCircle, TrendingUp, ArrowRight, Scissors, LayoutDashboard, Star } from "lucide-react"
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

  /**
   * 🔀 ESTRATÉGIA DE CONVERSÃO UNIFICADA (TIER-1)
   * Foco absoluto em B2B (Venda do Software) com via secundária limpa para B2C
   */
  const ctaContent = useMemo(() => {
    if (!isAuthenticated) {
      return {
        primary: {
          label: "CRIAR CONTA DA BARBEARIA",
          path: "/login-barbeiro", 
          icon: <TrendingUp className="w-5 h-5" />
        },
        secondary: {
          label: "SOU CLIENTE (AGENDAR)",
          path: "/descobrir",
          icon: <Calendar className="w-4 h-4" />
        }
      }
    }

    if (role === "barbeiro") {
      return {
        primary: {
          label: "ACESSAR MEU PAINEL",
          path: "/dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />
        },
        secondary: {
          label: "GERENCIAR AGENDA",
          path: "/agendamentos",
          icon: <Calendar className="w-4 h-4" />
        }
      }
    }

    // Role: Cliente Logado
    return {
      primary: {
        label: "AGENDAR NOVO SERVIÇO",
        path: "/descobrir",
        icon: <Scissors className="w-5 h-5" />
      },
      secondary: {
        label: "MEUS AGENDAMENTOS",
        path: "/meus-agendamentos",
        icon: <Calendar className="w-4 h-4" />
      }
    }
  }, [isAuthenticated, role])

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center px-4 py-20 overflow-hidden bg-background">
      {/* ⚡ Background Otimizado com BarberPro Identity */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.2) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center mt-10">
        <div
          className={cn(
            "transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
        >
          {/* 🚀 TIER-1: Prova Social Substituindo o "Antivírus" */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary/30 border border-primary/20 mb-8 backdrop-blur-md shadow-sm">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-[9px] font-black text-foreground uppercase tracking-[0.2em]">
              {isAuthenticated 
                ? `BEM-VINDO DE VOLTA, ${currentUser?.name?.split(' ')[0]}` 
                : "O SISTEMA DE GESTÃO Nº 1 PARA BARBEARIAS"}
            </span>
          </div>

          {/* 🚀 TIER-1: Headline Focada em Dor e Desejo (B2B) */}
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black italic uppercase tracking-tighter mb-6 text-balance leading-[0.9] text-foreground">
            AGENDA <span className="text-primary">LOTADA</span>,<br />
            LUCRO <span className="text-primary">NO BOLSO.</span>
          </h1>

          {/* 🚀 TIER-1: Subheadline Clara e Direta */}
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium uppercase tracking-widest opacity-80">
            {role === 'cliente' 
              ? "Estilo de elite ao alcance de um toque. Encontre sua barbearia favorita e agende em segundos."
              : "A plataforma definitiva para donos de barbearia. Automatize agendamentos, reduza faltas e gerencie sua equipe com tecnologia de ponta."}
          </p>

          {/* 🔀 Hierarquia de Botões (Otimizados para Conversão) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 max-w-2xl mx-auto">
            {/* Botão Primário (Venda SaaS) */}
            <button 
              onClick={() => handleNavigation(ctaContent.primary.path)}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm lg:text-base italic uppercase tracking-widest transition-all hover:scale-[1.03] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] active:scale-[0.98]"
            >
              {ctaContent.primary.icon}
              {ctaContent.primary.label}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>

            {/* Botão Secundário (Fantasma / B2C) */}
            <button 
              onClick={() => handleNavigation(ctaContent.secondary.path)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-transparent border-2 border-border text-muted-foreground hover:text-foreground rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:border-primary/50 hover:bg-secondary/20 active:scale-[0.98]"
            >
              {ctaContent.secondary.icon}
              {ctaContent.secondary.label}
            </button>
          </div>

          {/* Seção de Badges de Confiança (Benefícios) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto opacity-80">
            {[
              { icon: Calendar, text: "Agenda 24/7" },
              { icon: MessageCircle, text: "Lembretes Automáticos" },
              { icon: TrendingUp, text: "Métricas de Receita" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-secondary/10 border border-white/5 backdrop-blur-sm transition-all hover:bg-secondary/20">
                <feature.icon className="w-4 h-4 text-primary" />
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