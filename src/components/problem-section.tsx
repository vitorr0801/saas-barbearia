"use client"

import { X, Check, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const oldWay = [
  { text: "Agenda física: rasuras e perda de dados", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { text: "Hemorragia financeira por faltas (No-show)", icon: <TrendingDown className="w-3.5 h-3.5" /> },
  { text: "Caos no fechamento de caixa mensal", icon: <X className="w-3.5 h-3.5" /> },
  { text: "Cálculo de comissões manual e lento", icon: <X className="w-3.5 h-3.5" /> },
  { text: "Seu tempo preso a ligações e mensagens", icon: <X className="w-3.5 h-3.5" /> }
]

const newWay = [
  { text: "Blindagem total contra faltas (Lembretes)", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { text: "Agenda inteligente: agendamento 24h", icon: <Check className="w-3.5 h-3.5" /> },
  { text: "Lucro líquido calculado em tempo real", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { text: "Comissões automáticas por profissional", icon: <Check className="w-3.5 h-3.5" /> },
  { text: "Foco total na arte: o sistema faz o resto", icon: <Check className="w-3.5 h-3.5" /> }
]

export function ProblemSection() {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Elementos visuais de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20 space-y-4">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-primary bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
            Evolução Estratégica
          </span>
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground leading-none">
            SAIA DO <span className="text-muted-foreground/40">CAOS</span>, <br />
            ENTRE PARA A <span className="text-primary">ELITE.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-xs font-bold uppercase tracking-widest opacity-70">
            O amadorismo custa caro. O BarberPro é a ferramenta que separa os barbeiros que sobrevivem dos que dominam o mercado.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* O Velho Jeito (The Chaos) */}
          <div className="group p-10 rounded-[2.5rem] bg-secondary/10 border border-border/50 grayscale transition-all hover:grayscale-0">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-inner">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Gestão Amadora</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Onde seu lucro desaparece</p>
              </div>
            </div>
            
            <ul className="space-y-5">
              {oldWay.map((item, index) => (
                <li key={index} className="flex items-center gap-4 group/item">
                  <div className="w-8 h-8 rounded-xl bg-destructive/5 flex items-center justify-center flex-shrink-0 transition-colors group-hover/item:bg-destructive/10">
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground group-hover/item:text-foreground transition-colors">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* O Jeito BarberPro (The Elite) */}
          <div className="group p-10 rounded-[2.5rem] bg-card border-2 border-primary/20 relative shadow-2xl shadow-primary/5">
            {/* Glow effect sutil */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Check className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Domínio BarberPro</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tecnologia que gera lucro</p>
                </div>
              </div>

              <ul className="space-y-5">
                {newWay.map((item, index) => (
                  <li key={index} className="flex items-center gap-4 group/item">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors group-hover/item:bg-primary/20">
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold text-foreground">
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