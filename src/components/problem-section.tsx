"use client"

import { X, Check, AlertTriangle, Clock, Wallet, BarChart3, ShieldAlert, Zap, Lock, DollarSign, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"

// 🚀 TIER-1: Copywriting com foco total na DOR (Perda de Dinheiro e Tempo)
const oldWay = [
  { text: "Faltas e 'No-shows' destruindo seu lucro diário", icon: <Wallet className="w-3.5 h-3.5" /> },
  { text: "Horas perdidas no WhatsApp tentando marcar clientes", icon: <Clock className="w-3.5 h-3.5" /> },
  { text: "Cálculo de comissões manual, sujeito a erros e brigas", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { text: "Lucro invisível: você não sabe quanto realmente ganha", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { text: "Barbearia fechada = Zero novos agendamentos", icon: <X className="w-3.5 h-3.5" /> }
]

// 🚀 TIER-1: Copywriting com foco na CURA (Automação e Escala)
const newWay = [
  { text: "E-mails automáticos inibem faltas e garantem a cadeira cheia", icon: <Lock className="w-3.5 h-3.5" /> },
  { text: "Agenda 24/7: Clientes marcam sozinhos até de madrugada", icon: <Smartphone className="w-3.5 h-3.5" /> },
  { text: "Comissionamento automático, transparente e sem erros", icon: <Zap className="w-3.5 h-3.5" /> },
  { text: "Dashboard financeiro com seu lucro líquido em tempo real", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { text: "Foco 100% na arte da tesoura: o sistema cuida do balcão", icon: <DollarSign className="w-3.5 h-3.5" /> }
]

export function ProblemSection() {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Elementos visuais de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20 space-y-5">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-destructive bg-destructive/5 px-4 py-1.5 rounded-full border border-destructive/10">
            A Realidade do Mercado
          </span>
          {/* 🚀 TIER-1: Headline mais agressiva e focada na perda */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-foreground leading-[0.9]">
            PARE DE <span className="text-destructive">PERDER DINHEIRO</span> <br />
            COM A <span className="text-muted-foreground/40">AGENDA DE PAPEL.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs md:text-sm font-bold uppercase tracking-widest opacity-80 leading-relaxed">
            Cada cliente que esquece o horário é lucro que vai para o lixo. O BarberPro é a ferramenta que separa os amadores que sobrevivem, da elite que domina o mercado.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* O Velho Jeito (The Chaos) */}
          <div className="group p-8 md:p-10 rounded-[2.5rem] bg-secondary/10 border border-border/50 grayscale opacity-80 transition-all duration-500 hover:grayscale-0 hover:opacity-100">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-inner border border-destructive/20">
                <X className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Gestão Amadora</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Onde seu lucro desaparece</p>
              </div>
            </div>
            
            <ul className="space-y-6">
              {oldWay.map((item, index) => (
                <li key={index} className="flex items-start gap-4 group/item">
                  <div className="w-8 h-8 rounded-xl bg-destructive/5 flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover/item:bg-destructive/10 border border-destructive/10">
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground group-hover/item:text-foreground transition-colors duration-300 pt-1">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* O Jeito BarberPro (The Elite) */}
          <div className="group p-8 md:p-10 rounded-[2.5rem] bg-card border border-primary/30 relative shadow-[0_0_40px_rgba(245,158,11,0.05)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(245,158,11,0.15)] hover:-translate-y-1">
            {/* Glow effect sutil */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Check className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Ecossistema Elite</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tecnologia que gera lucro</p>
                </div>
              </div>

              <ul className="space-y-6">
                {newWay.map((item, index) => (
                  <li key={index} className="flex items-start gap-4 group/item">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover/item:bg-primary group-hover/item:scale-110">
                      {/* O ícone herda a cor do pai, mas no hover ele fica preto (primary-foreground) */}
                      <div className="text-primary group-hover/item:text-primary-foreground transition-colors duration-300">
                        {item.icon}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground pt-1 leading-snug">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}