"use client"

import { Scissors, Instagram, Linkedin, Youtube, Globe, Zap } from "lucide-react"

const footerLinks = {
  produto: [
    { name: "Funcionalidades", href: "#features" },
    { name: "Dashboard", href: "#dashboard" },
    { name: "Preços", href: "#pricing" },
    { name: "Integrações", href: "#" }
  ],
  empresa: [
    { name: "Sobre nós", href: "#" },
    { name: "Blog de Elite", href: "#" },
    { name: "Carreiras", href: "#" },
    { name: "Contato", href: "#" }
  ],
  suporte: [
    { name: "Central de Ajuda", href: "#" },
    { name: "Tutoriais Pro", href: "#" },
    { name: "Documentação API", href: "#" },
    { name: "Status do Sistema", href: "#" }
  ],
  legal: [
    { name: "Privacidade", href: "#" },
    { name: "Termos de Uso", href: "#" },
    { name: "Cookies", href: "#" }
  ]
}

export function Footer() {
  return (
    <footer className="bg-background relative overflow-hidden">
      {/* Detalhe visual de separação superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-16">
          
          {/* Brand & Mission */}
          <div className="col-span-2 space-y-6">
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
                <Scissors className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
                BARBER<span className="text-primary">PRO</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs">
              Elevando o patamar da gestão para barbearias de elite. Tecnologia, 
              estratégia e lucro na palma da sua mão.
            </p>
            {/* Status do Sistema (Toque de SaaS Pro) */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">
                Sistemas Operacionais: 100% Online
              </span>
            </div>
          </div>

          {/* Links Dinâmicos */}
          <div>
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

          <div>
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6">Empresa</h4>
            <ul className="space-y-4">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tight">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6">Suporte</h4>
            <ul className="space-y-4">
              {footerLinks.suporte.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tight">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
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

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
              © 2026 BarberPro HQ. Todos os direitos reservados.
            </p>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest flex items-center gap-1">
              Desenvolvido para mestre da tesoura <Scissors className="w-2.5 h-2.5" />
            </p>
          </div>

          {/* Social Icons & Language */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-5">
              <a href="#" className="text-muted-foreground hover:text-primary transition-all hover:-translate-y-1">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-all hover:-translate-y-1">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-all hover:-translate-y-1">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <div className="h-8 w-px bg-white/5 hidden md:block" />
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