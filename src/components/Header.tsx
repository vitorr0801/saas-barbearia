"use client"

import React, { useState, useMemo } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { 
  Menu, X, Scissors, LogOut, User, 
  LayoutDashboard, Calendar, Search, Heart 
} from "lucide-react"
import { useAuth } from "@/context/AuthContext" 
import { useQuery } from "@tanstack/react-query" 
import { supabase } from "@/lib/supabase"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { currentUser, isAuthenticated, logout, role, isLoading: authLoading } = useAuth()

  /** * 📡 BUSCA DO CONTADOR DE FAVORITOS (Otimização Máxima)
   * Usamos a mesma Query Key do ClientPortal para sincronia instantânea.
   */
  const { data: favoritesCount = 0 } = useQuery({
    queryKey: ["user-favorite-ids", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return 0;
      
      const { error, count } = await supabase
        .from("user_favorites")
        .select("target_id", { count: 'exact', head: true })
        .eq("user_id", currentUser.id)
        .eq("type", "shop");
      
      if (error) return 0;
      return count || 0;
    },
    // SÓ HABILITA se: o Auth terminou de carregar, temos usuário e ele é cliente
    enabled: !authLoading && !!currentUser?.id && role === 'cliente',
    staleTime: 1000 * 30, // 30 segundos de cache "fresco"
  });

  const displayName = useMemo(() => {
    if (!currentUser?.name) return "Perfil";
    const names = currentUser.name.trim().split(/\s+/);
    return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
  }, [currentUser?.name]);

  const handleLogoClick = () => {
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

  /**
   * 🛡️ PREVENT FLICKER: Enquanto o Auth carrega, mostramos um esqueleto minimalista.
   * Isso evita que o layout "salte" quando o usuário for identificado.
   */
  if (authLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-[999] bg-background/80 backdrop-blur-lg border-b border-border h-16 flex items-center px-4">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 animate-pulse" />
            <div className="w-24 h-4 bg-muted animate-pulse rounded" />
          </div>
          <div className="w-20 h-8 bg-muted animate-pulse rounded-xl" />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-background/80 backdrop-blur-lg border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
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

          {/* ÁREA DO USUÁRIO (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/cadastro" className="text-sm font-semibold text-muted-foreground hover:text-foreground px-4">Entrar</Link>
                <Link to="/cadastro" className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:shadow-lg transition-all active:scale-95">Começar grátis</Link>
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

                      {/* ❤️ FAVORITOS DESKTOP COM BADGE DINÂMICO */}
                      <Link to="/favoritos" className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors relative group">
                        <Heart className="w-4 h-4 group-hover:fill-red-500 group-hover:text-red-500 transition-all" />
                        Favoritos
                        {favoritesCount > 0 && (
                          <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in duration-300">
                            {favoritesCount}
                          </span>
                        )}
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
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Link to="/cadastro" onClick={() => setIsMenuOpen(false)} className="py-4 font-bold text-foreground bg-secondary rounded-2xl text-center">Entrar</Link>
                  <Link to="/cadastro" onClick={() => setIsMenuOpen(false)} className="py-4 bg-primary text-primary-foreground font-bold rounded-2xl text-center">Grátis</Link>
                </div>
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
                    
                    {/* ❤️ FAVORITOS MOBILE */}
                    <MobileNavItem 
                      icon={<Heart />} 
                      label="Meus Favoritos" 
                      to="/favoritos" 
                      onClick={() => setIsMenuOpen(false)} 
                      show={role === 'cliente'} 
                      badge={favoritesCount}
                    />

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

function MobileNavItem({ 
  icon, label, to, onClick, show, badge 
}: { 
  icon: React.ReactElement, label: string, to: string, onClick: () => void, show: boolean, badge?: number 
}) {
  if (!show) return null;
  return (
    <Link to={to} onClick={onClick} className="flex items-center justify-between p-4 font-bold text-foreground hover:bg-secondary rounded-2xl transition-all">
      <div className="flex items-center gap-4">
        <span className="text-primary">{React.cloneElement(icon, { className: "w-5 h-5" })}</span>
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full animate-in zoom-in">
          {badge}
        </span>
      )}
    </Link>
  );
}