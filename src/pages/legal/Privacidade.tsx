"use client"

import { useNavigate } from "react-router-dom"
import { ArrowLeft, Shield, Lock, Eye, CheckCircle2 } from "lucide-react"

export default function PoliticaPrivacidade() {
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
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">LGPD Compliant</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto px-6 pt-16 relative z-10 space-y-12">
        
        {/* Capa do Documento */}
        <div className="space-y-4 border-b border-border/40 pb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Lock className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Diretrizes de <span className="text-primary">Privacidade</span>
          </h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Última atualização: {dataAtual} • Em conformidade com a Lei nº 13.709 (LGPD)
          </p>
        </div>

        {/* Corpo do Texto Jurídico */}
        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed font-medium">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">1.</span> Informações que Coletamos
            </h2>
            <p>
              Para entregar uma experiência de agendamento ágil e segura, nós coletamos um espectro mínimo de dados, dividido em duas categorias:
            </p>
            <ul className="space-y-3 pl-2 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>Dados Cadastrais Básicos:</strong> Nome completo, endereço de e-mail corporativo ou pessoal e credenciais de acesso criptografadas de ponta a ponta.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>Dados de Comunicação e Operação:</strong> Número de WhatsApp (pessoal ou comercial) para envio automatizado de lembretes e histórico de agendamentos consumidos.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>Geolocalização por Satélite:</strong> Coletada de forma estritamente temporária e apenas mediante sua autorização explícita em tela para o funcionamento do Radar de Proximidade (raio de 7km).</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">2.</span> Como Utilizamos os Seus Dados
            </h2>
            <p>
              A BarberPro possui uma política rigorosa de **Zero Comercialização** de dados. As informações guardadas no nosso banco de dados isolado servem exclusivamente para:
            </p>
            <ul className="space-y-2 pl-2 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Processar e confirmar horários na agenda da barbearia escolhida.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Disparar micro-notificações contra esquecimentos e No-Show.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Garantir a segurança contra ataques automatizados de força bruta e injeções de código.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">3.</span> Compartilhamento de Informações com Terceiros
            </h2>
            <p>
              Seus dados nunca serão vendidos a redes de anúncio. O compartilhamento ocorre apenas de forma estritamente operacional:
            </p>
            <p className="pl-4 border-l-2 border-border/60 italic">
              "Seu nome e telefone são visíveis exclusivamente para a Barbearia onde você agendou um horário, permitindo que o profissional saiba quem irá atender e possa entrar em contato em caso de imprevistos."
            </p>
            <p className="pt-1">
              Os dados de pagamento trafegam de forma mascarada diretamente para a entidade bancária responsável, sem armazenamento de chaves de cartão de crédito nos nossos servidores locais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">4.</span> Retenção e Direitos de Exclusão (LGPD)
            </h2>
            <p>
              Em conformidade total com os direitos assegurados pela LGPD, o usuário possui o controle absoluto sobre seus dados. A qualquer momento, você pode navegar até o seu Perfil dentro da aplicação e solicitar a correção de dados, ou requerer o encerramento da conta com a **exclusão definitiva e imediata** de todas as suas informações pessoais de nossos servidores de armazenamento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              <span className="text-primary tabular-nums">5.</span> Protocolos de Segurança Criptográfica
            </h2>
            <p>
              A BarberPro opera sobre camadas robustas de criptografia SSL/TLS e hashes de segurança avançados na camada de autenticação de usuários. Para blindar a infraestrutura e mitigar tentativas de sobrecarga no banco de dados (DDoS por payload), todos os inputs e campos de texto possuem travas rígidas de limite de caracteres monitoradas em tempo real.
            </p>
          </section>

        </div>

        {/* Rodapé Interno da Página */}
        <div className="pt-8 border-t border-border/40 text-center">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            Encarregado de Proteção de Dados (DPO): dpo@barberpro.com.br
          </p>
        </div>
      </main>
    </div>
  )
}