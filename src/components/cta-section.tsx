"use client"

import { ArrowRight, Zap, ShieldCheck, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

export function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="py-32 px-4 relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
          
          {/* Background com Gradiente de Elite */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]" />
          
          {/* Content */}
          <div className="relative p-10 md:p-20 text-center space-y-8">
            
            {/* Badge de Fechamento */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 shadow-inner">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Acesso Imediato à Plataforma
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-foreground leading-[0.9]">
              O SEU IMPÉRIO <br />
              <span className="text-primary text-5xl md:text-7xl lg:text-8xl">COMEÇA AQUI.</span>
            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base font-bold leading-relaxed uppercase tracking-widest opacity-80">
              Não deixe o seu lucro na mão do acaso. Junte-se à elite das barbearias que 
              já automatizaram sua gestão com o <strong>BarberPro</strong>.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              {/* 🚀 TIER-1 FIX: Rota B2B Absoluta e Copywriting Direto */}
              <button 
                onClick={() => navigate("/login-barbeiro")}
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-6 bg-primary text-primary-foreground font-black italic uppercase text-lg lg:text-xl rounded-2xl transition-all hover:scale-105 hover:shadow-[0_20px_50px_rgba(245,158,11,0.3)] active:scale-95"
              >
                Começar 30 Dias Grátis
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>

            {/* Micro-Copy de Segurança (Quebra de Objeções Finais) */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-10 border-t border-white/5 mt-10">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {/* 🚀 TIER-1 FIX: Consistência Comercial com o FAQ */}
                30 Dias de Teste Grátis
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                Setup em 2 Minutos
              </div>
            </div>

            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mt-8">
              Sem cartão de crédito • Cancelamento Instantâneo
            </p>
          </div>

          {/* Efeito de Brilho nas Bordas */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        </div>
      </div>
    </section>
  )
}