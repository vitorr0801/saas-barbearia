"use client"

import React, { useState, useMemo } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Menu, X, Scissors, LogOut, User, LayoutDashboard, Calendar, Search } from "lucide-react"
import { useAuth } from "@/context/AuthContext" 

const navigation = [
  { name: "Funcionalidades", href: "#features" },
  { name: "Dashboard", href: "#dashboard" },
  { name: "Preços", href: "#pricing" }
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { currentUser, isAuthenticated, logout, role, isLoading } = useAuth()

  // 🛠️ HELPER: Nome de exibição inteligente (Memoizado)
  const displayName = useMemo(() => {
    if (!currentUser?.name) return "Perfil";
    const names = currentUser.name.trim().split(/\s+/);
    return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
  }, [currentUser?.name]);

  /**
   * 🚀 LÓGICA DE NAVEGAÇÃO SUPREMA
   * Ao clicar na logo, mandamos para "/" e o HomeRedirect do App.tsx
   * faz o trabalho de levar o Barbeiro ou Cliente para seus devidos lugares.
   */
  const handleLogoClick = () => {
    // Se já estiver na "Home" do usuário, fazemos o scroll para o topo
    const homePath = role === 'barbeiro' ? '/dashboard' : '/descobrir';
    if (location.pathname === homePath || location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    /* 🛡️ Z-INDEX 999: Garante que o Header flutue sobre QUALQUER conteúdo da página */
    <header className="fixed top-0 left-0 right-0 z-[999] bg-background/80 backdrop-blur-lg border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 🎯 LOGO & BRANDING - NAVEGAÇÃO NATIVA 
              Apontar para "/" aciona o HomeRedirect do seu App.tsx automaticamente.
          */}
          <Link 
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all active:scale-95 group relative z-[1000]"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tighter">BarberPro</span>
          </Link>

          {/* 🌐 NAV DESKTOP (Visitantes) */}
          {!isAuthenticated && !isLoading && (
            <div className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}

          {/* 👤 ÁREA DO USUÁRIO (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-32 h-9 bg-muted animate-pulse rounded-xl" />
            ) : !isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/cadastro" className="text-sm font-semibold text-muted-foreground hover:text-foreground px-4">
                  Entrar
                </Link>
                <Link to="/cadastro" className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:shadow-lg transition-all active:scale-95">
                  Começar grátis
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-5 border-r border-border pr-6">
                  {role === 'barbeiro' ? (
                    <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Painel
                    </Link>
                  ) : (
                    <>
                      <Link to="/meus-agendamentos" className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors">
                        <Calendar className="w-4 h-4" /> Agenda
                      </Link>
                      <Link to="/descobrir" className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors">
                        <Search className="w-4 h-4" /> Buscar
                      </Link>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Link 
                    to={role === 'barbeiro' ? '/perfil/barbeiro' : '/perfil/cliente'}
                    className="flex flex-col text-right group"
                  >
                    <span className="text-sm font-bold leading-none group-hover:text-primary transition-colors">
                      {displayName}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase mt-1 tracking-widest opacity-70">
                      {role === 'barbeiro' ? 'Profissional' : 'Cliente'}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Mobile */}
          <button
            className="md:hidden p-2 rounded-xl bg-secondary text-muted-foreground active:scale-95"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-border animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-5">
              {!isAuthenticated ? (
                <>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Link to="/cadastro" onClick={() => setIsMenuOpen(false)} className="py-4 font-bold text-foreground bg-secondary rounded-2xl text-center">Entrar</Link>
                    <Link to="/cadastro" onClick={() => setIsMenuOpen(false)} className="py-4 bg-primary text-primary-foreground font-bold rounded-2xl text-center">Grátis</Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-3xl">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{role}</p>
                    </div>
                  </div>
                  
                  <nav className="flex flex-col gap-1">
                    <MobileNavItem icon={<LayoutDashboard />} label="Painel" to="/dashboard" onClick={() => setIsMenuOpen(false)} show={role === 'barbeiro'} />
                    <MobileNavItem icon={<Calendar />} label="Agenda" to="/meus-agendamentos" onClick={() => setIsMenuOpen(false)} show={role === 'cliente'} />
                    <MobileNavItem icon={<Search />} label="Buscar" to="/descobrir" onClick={() => setIsMenuOpen(false)} show={role === 'cliente'} />
                    <MobileNavItem icon={<User />} label="Perfil" to={role === 'barbeiro' ? '/perfil/barbeiro' : '/perfil/cliente'} onClick={() => setIsMenuOpen(false)} show={true} />
                  </nav>

                  <button onClick={handleLogout} className="flex items-center justify-center gap-3 p-4 font-bold text-destructive bg-destructive/5 rounded-2xl mt-2 transition-transform active:scale-95">
                    <LogOut className="w-5 h-5" /> Sair da conta
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

function MobileNavItem({ icon, label, to, onClick, show }: { icon: React.ReactElement, label: string, to: string, onClick: () => void, show: boolean }) {
  if (!show) return null;
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-4 p-4 font-bold text-foreground hover:bg-secondary rounded-2xl transition-all">
      <span className="text-primary">{React.cloneElement(icon, { className: "w-5 h-5" })}</span>
      {label}
    </Link>
  );
}