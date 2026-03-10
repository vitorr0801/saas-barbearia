"use client"

import { X, Check } from "lucide-react"

const oldWay = [
  "Agenda de papel com rasuras",
  "Clientes faltam sem avisar",
  "Financeiro desorganizado",
  "Sem controle de comissões",
  "Perda de tempo com ligações"
]

const newWay = [
  "Agenda digital inteligente",
  "Confirmação automática via WhatsApp",
  "Dashboard financeiro em tempo real",
  "Comissões calculadas automaticamente",
  "Automação completa de lembretes"
]

export function ProblemSection() {
  return (
    <section className="py-24 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Transformação
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Da barbearia de papel para a barbearia tech
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Veja como o BarberPro transforma a gestão do seu negócio
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Old Way */}
          <div className="p-8 rounded-2xl bg-background border border-destructive/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Barbearia de papel</h3>
                <p className="text-sm text-muted-foreground">Lenta, esquecimentos, prejuízo</p>
              </div>
            </div>
            <ul className="space-y-4">
              {oldWay.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* New Way */}
          <div className="p-8 rounded-2xl bg-card border border-primary/30 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Barbearia tech</h3>
                  <p className="text-sm text-muted-foreground">Automática, escalável, organizada</p>
                </div>
              </div>
              <ul className="space-y-4">
                {newWay.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{item}</span>
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
