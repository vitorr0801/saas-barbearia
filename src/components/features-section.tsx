"use client"

import { 
  MessageCircle, Users, BarChart3, 
  Smartphone, Clock, ShieldCheck, 
  Zap, Trophy, Target 
} from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Target,
    title: "Agendamento de Elite",
    description: <>Interface intuitiva que permite ao seu cliente marcar um serviço em segundos. <strong>Fluxo otimizado para conversão.</strong></>,
    highlight: "3 Cliques para o Corte"
  },
  {
    icon: Users,
    title: "Comando de Equipe",
    description: <>Controle total de múltiplas bancadas. Comissões automáticas e métricas <strong>individuais de produtividade.</strong></>,
    highlight: "Gestão de Comissões 100% Automática"
  },
  {
    icon: BarChart3,
    title: "Inteligência Financeira",
    description: <>Visualize seu lucro real, ticket médio e projeções futuras em dashboards que <strong>te dão clareza e controle total.</strong></>,
    highlight: "Previsibilidade de Receita"
  },
  {
    icon: MessageCircle,
    title: "Blindagem de Agenda",
    description: <>Lembretes automáticos via WhatsApp que reduzem faltas drasticamente. Sua cadeira <strong>nunca mais ficará vazia.</strong></>,
    highlight: "Redução de 80% no No-Show"
  },
  {
    icon: Smartphone,
    title: "Controle Mobile-First",
    description: <>Gerencie toda a operação da barbearia de onde estiver. O poder de uma <strong>grande empresa na palma da mão.</strong></>,
    highlight: "Sua Barbearia no Bolso"
  },
  {
    icon: ShieldCheck,
    title: "Protocolo de Segurança",
    description: <>Dados criptografados e backups diários. Sua inteligência de negócio protegida pelo <strong>nosso protocolo de elite v3.0.</strong></>,
    highlight: "Padrão de Segurança Bancária"
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-background relative" id="features">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary fill-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Arsenal de Gestão
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground leading-[0.9]">
            DOMINE CADA <span className="text-primary">DETALHE</span> <br />
            DA SUA OPERAÇÃO.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs font-bold uppercase tracking-widest opacity-60">
            Ferramentas cirúrgicas desenhadas para quem não aceita nada menos que a excelência na gestão da barbearia.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-[2rem] bg-secondary/5 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col justify-between"
            >
              <div>
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-all duration-500 shadow-inner">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                {/* 🛠️ AJUSTE: Removido 'h-12 overflow-hidden' para o texto aparecer completo */}
                <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
                  {feature.description}
                </p>
              </div>

              {/* Footer Highlight */}
              <div className="pt-6 border-t border-border/40">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                    {feature.highlight}
                  </span>
                </div>
              </div>

              {/* Glow sutil no hover */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}