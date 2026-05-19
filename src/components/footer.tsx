"use client"

import { Scissors, Instagram, Globe } from "lucide-react"

// 🚀 TIER-1: Estrutura Enxuta e Realista (Fim da Paranoia Jurídica)
const footerLinks = {
  produto: [
    { name: "Para Barbearias", href: "/login-barbeiro" },
    { name: "Para Clientes", href: "/descobrir" },
    { name: "Preços", href: "#pricing" },
    { name: "Funcionalidades", href: "#features" }
  ],
  atendimento: [
    { name: "Suporte via WhatsApp", href: "https://wa.me/5500000000000" },
    { name: "E-mail Oficial", href: "mailto:suporte@barberpro.com.br" },
    { name: "Dúvidas Frequentes (FAQ)", href: "/faq" }
  ],
  legal: [
    // 🚀 TIER-1: Apenas os pilares. A Política de Privacidade já cobre Cookies e LGPD.
    { name: "Política de Privacidade", href: "/privacidade" },
    { name: "Termos de Uso", href: "/termos" }
  ]
}

export function Footer() {
  return (
    <footer className="bg-background relative overflow-hidden">
      {/* Detalhe visual de separação superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        
        {/* 🚀 TIER-1 FIX: Flexbox Inquebrável (Garante layout horizontal no Desktop) */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Mission (Ancorado à esquerda) */}
          <div className="lg:max-w-sm space-y-6">
            <a href="/" className="flex items-center gap-2 group outline-none w-fit">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
                <Scissors className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
                BARBER<span className="text-primary">PRO</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Elevando o patamar da gestão para barbearias de elite. Tecnologia, 
              estratégia e lucro na palma da sua mão.
            </p>
            {/* Status do Sistema */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">
                Sistemas Operacionais: 100% Online
              </span>
            </div>
          </div>

          {/* 🚀 Listas de Links (Alinhadas horizontalmente na direita em telas grandes) */}
          <div className="flex flex-wrap sm:flex-nowrap gap-12 lg:gap-24">
            
            {/* Coluna 1: Produto */}
            <div className="min-w-[120px]">
              <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6">Produto</h4>
              <ul className="space-y-4">
                {footerLinks.produto.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tight">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna 2: Contato & Suporte */}
            <div className="min-w-[120px]">
              <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6">Contato & Suporte</h4>
              <ul className="space-y-4">
                {footerLinks.atendimento.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tight">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna 3: Legal */}
            <div className="min-w-[120px]">
              <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6">Legal</h4>
              <ul className="space-y-4">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tight">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1.5 text-center md:text-left">
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} BarberPro Soluções em Tecnologia Ltda. Todos os direitos reservados.
            </p>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
              CNPJ: 00.000.000/0001-00 <span className="mx-1 hidden sm:inline">•</span><br className="sm:hidden" /> Feito para mestres da tesoura <Scissors className="w-2.5 h-2.5 ml-0.5" />
            </p>
          </div>

          {/* Social Icons & Language */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-5">
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram da BarberPro" className="text-muted-foreground hover:text-primary transition-all hover:-translate-y-1">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div className="h-8 w-px bg-border/40 hidden md:block" />
            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>PT-BR</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}