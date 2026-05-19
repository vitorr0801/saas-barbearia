"use client"

import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, HelpCircle, ChevronDown, Mail, ShieldCheck, Briefcase, User } from "lucide-react"
import { cn } from "@/lib/utils"

// 🚀 TIER-1: Dados estruturados para fácil filtragem e geração de SEO
const faqs = [
  {
    id: "b2b",
    category: "Para Donos de Barbearia",
    icon: <Briefcase className="w-4 h-4" />,
    questions: [
      {
        q: "Como funciona o período de teste e a cobrança da assinatura?",
        a: "Você inicia com 30 dias totalmente gratuitos (1 mês grátis) para testar todas as ferramentas do sistema sem qualquer restrição. Após o período de teste, será cobrada uma mensalidade fixa baseada exclusivamente na quantidade de 'cadeiras' (profissionais ativos) que você utiliza na sua conta. Dessa forma, você paga um valor justo e proporcional ao tamanho do seu negócio."
      },
      {
        q: "Como o BarberPro ajuda a aumentar meu faturamento e gerenciar o caixa?",
        a: "A plataforma ataca diretamente o maior gargalo das barbearias: as cadeiras vazias. O sistema dispara e-mails automatizados de confirmação e lembrete para evitar esquecimentos. Além disso, ao permitir que o cliente pague antecipadamente pelo site, você garante o recebimento do serviço antes mesmo do cliente sentar na cadeira, eliminando o prejuízo com faltas."
      },
      {
        q: "Como funcionam os lembretes de agendamentos para os clientes?",
        a: "Toda a nossa esteira de comunicação é feita via E-mail corporativo de alta entrega. Assim que o cliente agenda, ele recebe uma confirmação instantânea na caixa de entrada e, posteriormente, um lembrete inteligente antes do horário marcado, reduzindo as faltas sem gerar custos adicionais de pacotes de mensagens para a sua barbearia."
      },
      {
        q: "Posso adicionar outros barbeiros da minha equipe na mesma conta?",
        a: "Sim. O sistema suporta múltiplos profissionais. Cada barbeiro cadastrado terá seu próprio painel de acesso, controle de horários e agenda individualizada. O valor da sua assinatura se ajustará dinamicamente apenas com base nas cadeiras ativas que você optar por manter no sistema."
      },
      {
        q: "Terei auxílio ou suporte para configurar minha barbearia no início?",
        a: "Com certeza. Nós oferecemos um canal de suporte dedicado para ajudar você e sua equipe durante a implantação inicial. Auxiliamos na configuração dos horários de funcionamento, cadastro da cartela de serviços, preços, e no mapeamento das cadeiras para que sua operação comece rodando no padrão de elite desde o primeiro dia."
      },
      {
        q: "Existe algum contrato de fidelidade ou taxa oculta de cancelamento?",
        a: "Não. Operamos com transparência absoluta no padrão SaaS internacional. Nossos planos são mensais e livres de fidelidade. Você pode utilizar o sistema, escalar sua operação e, se por qualquer motivo decidir sair, poderá cancelar a assinatura diretamente no seu painel de configurações com um clique, sem multas ou burocracia."
      }
    ]
  },
  {
    id: "b2c",
    category: "Para Clientes",
    icon: <User className="w-4 h-4" />,
    questions: [
      {
        q: "É cobrado algum valor ou taxa para eu agendar meu horário pelo site?",
        a: "O uso da plataforma BarberPro para buscar barbearias, consultar horários e agendar serviços é 100% gratuito para os clientes finais. Você nunca pagará taxas de conveniência adicionais para reservar o seu horário."
      },
      {
        q: "Como faço para realizar o pagamento do meu corte ou serviço?",
        a: "A plataforma oferece flexibilidade total para o seu bolso. Você pode optar por realizar o pagamento online de forma rápida e segura diretamente pelo site no momento do agendamento, ou fazer o pagamento tradicional fisicamente direto na barbearia após o término do atendimento."
      },
      {
        q: "Como vou me lembrar do horário que agendei?",
        a: "Nossa plataforma gerencia seus horários de forma inteligente. Assim que o agendamento é concluído, enviamos um e-mail de confirmação com os dados do profissional escolhido. Próximo ao momento do seu atendimento, você receberá um e-mail de lembrete com a rota e o horário para garantir que não se atrase."
      },
      {
        q: "Como faço para cancelar ou alterar um horário que já marquei?",
        a: "Basta acessar a área 'Meus Agendamentos' no seu perfil pelo site. Lá você tem autonomia completa para reagendar ou cancelar o serviço em segundos. Pedimos apenas que verifique e respeite o tempo de antecedência mínima exigido nas políticas internas da barbearia selecionada."
      }
    ]
  }
]

export default function FAQ() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"b2b" | "b2c">("b2b")
  const [openIndex, setOpenIndex] = useState<number | null>(0) 

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  // 🚀 TIER-1: Motor Invisível de SEO (JSON-LD para o Google ler as perguntas)
  const schemaMarkup = useMemo(() => {
    const allQuestions = faqs.flatMap(section => section.questions);
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": allQuestions.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };
  }, []);

  const activeContent = faqs.find(f => f.id === activeTab);

  return (
    <div className="min-h-screen bg-[#0a0c12] text-foreground relative overflow-x-hidden pb-20 selection:bg-primary/20">
      
      {/* 🚀 Injeção do SEO Script no HTML */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />

      {/* Background Glow sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Header de Navegação */}
      <header className="sticky top-0 z-50 bg-[#0a0c12]/80 backdrop-blur-md border-b border-border/40 h-20 flex items-center">
        <div className="max-w-4xl mx-auto w-full px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group outline-none"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Central de Ajuda</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto px-6 pt-12 sm:pt-16 relative z-10 space-y-10">
        
        {/* Capa do Documento */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto sm:mx-0">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">
            Dúvidas <span className="text-primary">Frequentes</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground max-w-xl mx-auto sm:mx-0">
            Esclareça suas dúvidas sobre o funcionamento das assinaturas, agendamentos e segurança da plataforma.
          </p>
        </div>

        {/* 🚀 TIER-1: Tabs de Navegação (Isolamento de Contexto B2B vs B2C) */}
        <div className="flex p-1 bg-secondary/30 rounded-2xl border border-border/40">
          {faqs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as "b2b" | "b2c");
                setOpenIndex(0); // Reseta abrindo a primeira da nova aba
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.category}</span>
              <span className="sm:hidden">{tab.id === "b2b" ? "Barbearias" : "Clientes"}</span>
            </button>
          ))}
        </div>

        {/* Accordion List Filtrado */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeContent?.questions.map((faq, qIndex) => {
            const isOpen = openIndex === qIndex;

            return (
              <div 
                key={qIndex} 
                className={cn(
                  "rounded-2xl border transition-all duration-300 overflow-hidden",
                  isOpen ? "bg-secondary/20 border-primary/30" : "bg-card/30 border-border/40 hover:border-primary/20"
                )}
              >
                <button
                  onClick={() => toggleFAQ(qIndex)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className={cn(
                    "text-sm sm:text-base font-bold pr-4 transition-colors leading-snug",
                    isOpen ? "text-white" : "text-foreground"
                  )}>
                    {faq.q}
                  </span>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300",
                    isOpen ? "bg-primary/20 rotate-180" : "bg-secondary"
                  )}>
                    <ChevronDown className={cn("w-4 h-4", isOpen ? "text-primary" : "text-muted-foreground")} />
                  </div>
                </button>
                
                <div 
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-5 px-5" : "grid-rows-[0fr] opacity-0 px-5"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rota de Escape */}
        <div className="pt-8 mt-12 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-primary/5 border border-primary/10 rounded-3xl p-6 sm:p-8">
            <div className="text-center sm:text-left space-y-2">
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Ainda tem dúvidas?
              </h3>
              <p className="text-xs text-muted-foreground">Fale diretamente com o nosso time de especialistas para suporte.</p>
            </div>
            <a 
              href="mailto:suporte@barberpro.com.br" 
              className="shrink-0 flex items-center gap-2 h-12 px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <Mail className="w-4 h-4" /> Abrir Chamado
            </a>
          </div>
        </div>

      </main>
    </div>
  )
}