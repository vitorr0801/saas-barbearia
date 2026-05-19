"use client"

import { 
  Users, BarChart3, 
  Smartphone, Clock, ShieldCheck, 
  Zap, Trophy, Target, Mail 
} from "lucide-react"
import { cn } from "@/lib/utils"

// 🚀 TIER-1: Copywriting 100% alinhado com as regras de negócio e focado na transformação B2B
const features = [
  {
    icon: Target,
    title: "Motor de Agendamento 24/7",
    description: <>Seu cliente agenda de madrugada, sem fricção. Uma vitrine digital otimizada para <strong>transformar visitantes em clientes</strong> com apenas 3 cliques.</>,
    highlight: "Fim das mensagens de madrugada"
  },
  {
    icon: Mail, // 🚀 Atualizado para E-mail
    title: "Blindagem Anti-Faltas",
    description: <>Esqueça os buracos na agenda. O sistema dispara <strong>e-mails automáticos</strong> de confirmação e lembrete, garantindo a presença do cliente na cadeira.</>,
    highlight: "Redução de 80% no No-Show"
  },
  {
    icon: BarChart3,
    title: "Dashboard Financeiro",
    description: <>Diga adeus às planilhas confusas. Visualize seu lucro líquido diário, ticket médio e projete seu <strong>faturamento em tempo real.</strong></>,
    highlight: "Previsibilidade de Caixa"
  },
  {
    icon: Users,
    title: "Gestão de Múltiplas Cadeiras",
    description: <>Cresça sem dor de cabeça. Cadastre a equipe, acompanhe a produtividade e deixe o sistema <strong>calcular as comissões automaticamente.</strong></>,
    highlight: "Fechamento de Mês em 1 Minuto"
  },
  {
    icon: Smartphone,
    title: "Operação 100% na Nuvem",
    description: <>Não precisa de computadores caros. A tecnologia Mobile-First permite que você gerencie sua barbearia de <strong>qualquer lugar, direto do celular.</strong></>,
    highlight: "Sua Barbearia no Bolso"
  },
  {
    icon: ShieldCheck,
    title: "Infraestrutura de Elite",
    description: <>Hospedagem em servidores de alta performance, backups diários invisíveis e <strong>conformidade total com a LGPD.</strong> Seus dados estão seguros.</>,
    highlight: "Segurança e Compliance B2B" // 🚀 Adeus "Antivírus v3.0"
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-foreground leading-[0.9]">
            DOMINE CADA <span className="text-primary">DETALHE</span> <br />
            DA SUA OPERAÇÃO.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs md:text-sm font-bold uppercase tracking-widest opacity-80 leading-relaxed">
            Automação cirúrgica e previsibilidade para você focar no que realmente importa: a arte da tesoura e o crescimento do seu negócio.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-[2.5rem] bg-secondary/5 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(245,158,11,0.08)] flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-background border border-border/60 flex items-center justify-center mb-6 group-hover:bg-primary transition-all duration-500 shadow-inner group-hover:scale-110">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
                  {feature.description}
                </p>
              </div>

              {/* Footer Highlight */}
              <div className="pt-6 border-t border-border/40">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 transition-colors group-hover:bg-primary/10 group-hover:border-primary/20">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                    {feature.highlight}
                  </span>
                </div>
              </div>

              {/* Glow sutil no hover */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}