"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Scale, Shield, FileText, CheckCircle2 } from "lucide-react"

export default function TermosUso() {
  const navigate = useNavigate()
  const dataAtual = new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long" })

  return (
    <div className="min-h-screen bg-[#0a0c12] text-foreground relative overflow-x-hidden pb-20 selection:bg-primary/20">
      {/* Background Glow sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Header de Navegação Legal */}
      <header className="sticky top-0 z-50 bg-[#0a0c12]/80 backdrop-blur-md border-b border-border/40 h-20 flex items-center">
        <div className="max-w-4xl mx-auto w-full px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Compliance Operacional</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto px-6 pt-16 relative z-10 space-y-12">
        
        {/* Capa do Documento */}
        <div className="space-y-4 border-b border-border/40 pb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Termos de <span className="text-primary">Uso</span>
          </h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Última atualização: {dataAtual} • Versão 1.0 (Contrato de Adesão)
          </p>
        </div>

        {/* Corpo do Texto Jurídico */}
        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed font-medium">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">1.</span> Aceitação dos Termos
            </h2>
            <p>
              Ao acessar, cadastrar-se ou utilizar a plataforma <strong>BarberPro</strong>, seja na condição de estabelecimento parceiro (Barbearia) ou de usuário final (Cliente), você concorda integralmente com as regras, obrigações e condições descritas neste instrumento. Caso não concorde com qualquer disposição aqui contida, você não deverá utilizar os nossos serviços.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">2.</span> Escopo dos Serviços
            </h2>
            <p>
              A BarberPro opera estritamente como uma plataforma tecnológica de intermediação, fornecendo:
            </p>
            <ul className="space-y-2 pl-2 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Softwares de gestão empresarial, fluxo de caixa, dashboards e agendamento para profissionais da beleza.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Marketplace e motores de busca de agendamento online para conveniência de clientes finais.</span>
              </li>
            </ul>
            <p className="pt-2">
              Fica expressamente estabelecido que a BarberPro <strong>não possui qualquer vínculo empregatício ou societário</strong> com os estabelecimentos parceiros cadastrados, eximindo-se de qualquer responsabilidade sobre a qualidade, atrasos ou condutas nos serviços físicos prestados dentro das barbearias.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">3.</span> Segurança de Contas e Credenciais
            </h2>
            <p>
              Você é o único responsável por manter o sigilo de suas credenciais de acesso (e-mail e senha). Qualquer atividade realizada sob a sua conta será de sua inteira responsabilidade. Em cumprimento às diretrizes internacionais de segurança, o sistema limita o tamanho de payloads e inputs para evitar injeções maliciosas e garantir a estabilidade do servidor para toda a rede.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">4.</span> Cancelamentos e No-Show (Faltas)
            </h2>
            <p>
              Os agendamentos são vinculados às regras operacionais de cada Barbearia parceira. Os termos de cancelamento, tolerância de atrasos e possíveis políticas de reembolso financeiro por falta (No-Show) são configurados de maneira independente pelos estabelecimentos, devendo o Cliente sanar dúvidas diretamente com o local escolhido.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">5.</span> Planos de Assinatura e Cobrança (B2B)
            </h2>
            <p>
              Os estabelecimentos parceiros concordam com as cobranças recorrentes baseadas no plano selecionado no momento do onboarding. O processamento financeiro é realizado de forma segura através de gateways criptografados parceiros homologados pelo Banco Central do Brasil. A inadimplência resultará na suspensão temporária do acesso ao Painel Administrativo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">6.</span> Limitação de Responsabilidade
            </h2>
            <p>
              A BarberPro envida esforços comerciais e técnicos de nível mundial para manter a plataforma ativa com 99.9% de uptime. No entanto, não nos responsabilizamos por instabilidades temporárias decorrentes de falhas nos serviços globais de internet, operadoras de telecomunicação ou atualizações forçadas em bancos de dados parceiros.
            </p>
          </section>

        </div>

        {/* Rodapé Interno da Página */}
        <div className="pt-8 border-t border-border/40 text-center">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            BarberPro Soluções Digitais • Foro Central de São Paulo/SP
          </p>
        </div>
      </main>
    </div>
  )
}