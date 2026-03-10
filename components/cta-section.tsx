"use client"

import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-card" />
          <div className="absolute inset-0 opacity-30">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)`,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Chega de perder dinheiro com falta de organização
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Junte-se a centenas de barbearias que já transformaram sua gestão e 
              aumentaram o faturamento com o BarberPro.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg">
                Cadastrar minha barbearia
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Teste grátis por 14 dias. Sem cartão de crédito.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
