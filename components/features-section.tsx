"use client"

import { MessageCircle, Users, BarChart3, Smartphone, Clock, Shield } from "lucide-react"

const features = [
  {
    icon: MessageCircle,
    title: "Agendamento sem fricção",
    description: "Validação automática via WhatsApp em apenas 3 cliques. Seus clientes confirmam presença e você elimina faltas.",
    highlight: "Redução de 80% nas faltas"
  },
  {
    icon: Users,
    title: "Gestão de bancada",
    description: "Visão específica para cada profissional. Controle de comissões, agenda individual e métricas de performance.",
    highlight: "Controle total da equipe"
  },
  {
    icon: BarChart3,
    title: "BI e financeiro",
    description: "Gráficos de lucro e faturamento instantâneo. Dashboard completo com ticket médio, crescimento e projeções.",
    highlight: "Dados em tempo real"
  },
  {
    icon: Smartphone,
    title: "100% mobile",
    description: "Acesse de qualquer lugar. Interface otimizada para gerenciar sua barbearia direto do celular.",
    highlight: "Gestão na palma da mão"
  },
  {
    icon: Clock,
    title: "Lembretes automáticos",
    description: "Sistema de notificações inteligentes que lembram seus clientes do horário marcado.",
    highlight: "Nunca mais esqueça"
  },
  {
    icon: Shield,
    title: "Dados seguros",
    description: "Suas informações protegidas com criptografia de nível bancário. Backup automático diário.",
    highlight: "Segurança garantida"
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Tudo que você precisa para escalar sua barbearia
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Ferramentas poderosas que transformam a gestão do seu negócio
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {feature.description}
              </p>
              <span className="inline-flex items-center text-sm text-primary font-medium">
                {feature.highlight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
