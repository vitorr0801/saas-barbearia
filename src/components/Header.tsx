"use client"

import React, { useState, useMemo } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { 
  Menu, X, Scissors, LogOut,
  LayoutDashboard, Calendar, Search, Heart, UserCircle, Wallet, Package, Users, Settings
} from "lucide-react"
import { useAuth } from "@/context/AuthContext" 
import { useQuery } from "@tanstack/react-query" 
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, isAuthenticated, logout, role, isLoading: authLoading } = useAuth()

  // 🚀 RBAC: LÓGICA DE CARGOS DO HEADER MUNDIAL
  const isOwner = Boolean(currentUser?.is_admin);
  const userJob = (currentUser?.job_title || "barbeiro").toLowerCase().trim();
  const isManager = userJob === "gerente";
  const isSecretary = userJob === "secretária" || userJob === "secretaria";

  const canSeePainel = !(isManager || isSecretary); // Oculta Dashboard para Staff
  const canSeeFinanceiro = isOwner;
  const canSeeEquipe = isOwner || isManager;
  const canSeeConfiguracoes = isOwner || isManager;
  const canSeeProdutos = isOwner || isManager || isSecretary;

  // 🚩 DEFINIÇÃO DE CONTEXTOS
  const isDiscoveryPage = location.pathname === "/descobrir";

  const barberWorkspacePaths = [
    "/dashboard",
    "/agendamentos",
    "/financeiro",
    "/produtos",
    "/bancada",
    "/onboarding",
    "/setup",
    "/perfil/barbeiro",
    "/equipe",
    "/dashboard/configuracoes"
  ];

  const isBarberWorkspace =
    isAuthenticated &&
    role === "barbeiro" &&
    barberWorkspacePaths.some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
    );

  const isClientContext = isDiscoveryPage || 
                          location.pathname.startsWith("/agendar") ||
                          location.pathname.startsWith("/favoritos") ||
                          (isAuthenticated && role === 'cliente');

  const showBookingStyleCenter = isClientContext || isBarberWorkspace;

  /** 📡 BUSCA DO STATUS DE FAVORITOS */
  const { data: favoritesCount = 0 } = useQuery({
    queryKey: ["user-favorites-count", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return 0;
      const { count, error } = await supabase
        .from("user_favorites")
        .select("*", { count: 'exact', head: true }) 
        .eq("user_id", currentUser.id);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !authLoading && !!currentUser?.id && role === 'cliente' && isAuthenticated,
    staleTime: 1000 * 60 * 2, 
  });

  const displayName = useMemo(() => {
    if (!currentUser?.name) return "Perfil";
    return currentUser.name.split(" ")[0]; 
  }, [currentUser?.name]);

  const handleProtectedAction = (e: React.MouseEvent, to: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.info("Ação Necessária", {
        description: "Entre ou crie sua conta para acessar estas funcionalidades.",
        action: { label: "Entrar", onClick: () => navigate("/login-cliente") },
      });
      return;
    }
    navigate(to);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    const homePath = !isAuthenticated ? "/" : (role === 'barbeiro' ? '/dashboard' : '/descobrir');
    if (location.pathname === homePath) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  if (authLoading) {
    return <header className="fixed top-0 left-0 right-0 z-[999] bg-[#0a0c12]/90 backdrop-blur-md border-b border-white/5 h-20" />;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-[#0a0c12]/95 backdrop-blur-md border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* 1. LOGO */}
          <Link 
            to={!isAuthenticated ? "/" : (role === 'barbeiro' ? (canSeePainel ? '/dashboard' : '/agendamentos') : '/descobrir')}
            onClick={handleLogoClick}
            className="flex items-center gap-2 group shrink-0 relative z-[1000]"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
              BARBER<span className="text-primary">PRO</span>
            </span>
          </Link>

          {/* 2. NAV CENTRAL */}
          <div className="hidden lg:flex flex-1 justify-center px-8">
            {!showBookingStyleCenter ? (
              <div className="flex items-center gap-10">
                {[{ label: "Home", href: "/" }, { label: "Sobre", href: "#problem" }, { label: "Funções", href: "#features" }, { label: "Preços", href: "#pricing" }].map((item) => (
                  <a key={item.label} href={item.href} className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">
                    {item.label}
                  </a>
                ))}
              </div>
            ) : (
              <div className="w-full max-w-md relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder={isBarberWorkspace ? "Buscar cliente, serviço ou histórico..." : "Buscar barbearia ou serviço..."} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/20"
                />
              </div>
            )}
          </div>

          {/* 3. AÇÕES DA DIREITA */}
          <div className="flex items-center gap-4">
            
            {isClientContext && (
              <div className="hidden md:flex items-center gap-6 mr-2">
                <button onClick={(e) => handleProtectedAction(e, "/meus-agendamentos")} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors">
                  <Calendar className="w-4 h-4" /> Agenda
                </button>
                <button onClick={(e) => handleProtectedAction(e, "/favoritos")} className="relative group p-2 rounded-xl hover:bg-white/5 transition-all">
                  <Heart className={cn("w-5 h-5 transition-all duration-300", isAuthenticated && favoritesCount > 0 ? "text-red-500 fill-red-500/10" : "text-white/40 group-hover:text-white")} />
                  {isAuthenticated && favoritesCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-[#0a0c12] animate-in zoom-in" />
                  )}
                </button>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isDiscoveryPage ? (
                  <Button onClick={() => navigate("/login-cliente")} variant="outline" className="h-10 px-8 bg-white/5 border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all active:scale-95 shadow-sm">
                    Entrar
                  </Button>
                ) : (
                  <>
                    <button onClick={() => navigate("/descobrir")} className="hidden sm:flex h-10 px-5 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95">
                      Sou Cliente
                    </button>
                    <Button onClick={() => navigate("/login-barbeiro")} className="h-10 px-8 bg-primary text-primary-foreground font-black uppercase italic text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                      Acessar
                    </Button>
                  </>
                )}
              </div>
            ) : isBarberWorkspace ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden md:flex items-center gap-5 border-r border-white/10 pr-5 mr-1">
                  <Link
                    to="/agendamentos"
                    className={cn(
                      "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors",
                      location.pathname.startsWith("/agendamentos") && "text-primary",
                    )}
                  >
                    <Calendar className="w-4 h-4 shrink-0" /> Agenda
                  </Link>

                  {/* 🚀 TRAVA DO PAINEL */}
                  {canSeePainel && (
                    <Link
                      to="/dashboard"
                      className={cn(
                        "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors",
                        location.pathname === "/dashboard" && "text-primary",
                      )}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" /> Painel
                    </Link>
                  )}

                  {canSeeFinanceiro && (
                    <Link
                      to="/financeiro"
                      className={cn(
                        "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors",
                        location.pathname.startsWith("/financeiro") && "text-primary",
                      )}
                    >
                      <Wallet className="w-4 h-4 shrink-0" /> Financeiro
                    </Link>
                  )}
                  {canSeeProdutos && (
                    <Link
                      to="/produtos"
                      className={cn(
                        "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors",
                        location.pathname.startsWith("/produtos") && "text-primary",
                      )}
                    >
                      <Package className="w-4 h-4 shrink-0" /> Produtos
                    </Link>
                  )}
                  {canSeeConfiguracoes && (
                    <Link
                      to="/dashboard/configuracoes"
                      className={cn(
                        "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors",
                        location.pathname.startsWith("/dashboard/configuracoes") && "text-primary",
                      )}
                    >
                      <Settings className="w-4 h-4 shrink-0" /> Configurações
                    </Link>
                  )}
                  {canSeeEquipe && (
                    <Link
                      to="/equipe"
                      className={cn(
                        "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-colors",
                        location.pathname.startsWith("/equipe") && "text-primary",
                      )}
                    >
                      <Users className="w-4 h-4 shrink-0" /> Equipe
                    </Link>
                  )}
                </div>
                <Link
                  to="/perfil/barbeiro"
                  title="Meu perfil"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/15 text-white hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <UserCircle className="w-5 h-5 strokeWidth={1.75}" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sair"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  <LogOut className="w-5 h-5 strokeWidth={1.75}" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 sm:gap-6">
                {role === "barbeiro" && !isBarberWorkspace && canSeePainel && (
                  <Link to="/dashboard" className="hidden md:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white hover:text-primary transition-colors border-r border-white/10 pr-6 mr-2">
                    <LayoutDashboard className="w-4 h-4" /> Painel
                  </Link>
                )}
                <Link to={role === "barbeiro" ? "/perfil/barbeiro" : "/perfil/cliente"} className="flex items-center gap-3 group">
                  <div className="hidden xs:flex flex-col text-right">
                    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{displayName}</span>
                    <span className="text-[9px] font-black text-primary uppercase opacity-70 tracking-tighter">{role}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-all">
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                </Link>
                <button onClick={handleLogout} className="p-2.5 rounded-xl bg-white/5 hover:bg-destructive/10 hover:text-destructive transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <button className="lg:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MENU MOBILE ADAPTADO COM RBAC */}
        {isMenuOpen && (
          <div className="lg:hidden py-8 border-t border-white/5 animate-in slide-in-from-top-4">
            <div className="flex flex-col gap-6 px-2">
              {!isAuthenticated ? (
                <>
                  <Button onClick={() => { navigate(isDiscoveryPage ? "/login-cliente" : "/login-barbeiro"); setIsMenuOpen(false); }} className="h-14 bg-primary text-primary-foreground font-black uppercase italic rounded-2xl">
                    {isDiscoveryPage ? "Entrar na Conta" : "Acessar Sistema"}
                  </Button>
                  {!isDiscoveryPage && (
                    <button onClick={() => { navigate("/descobrir"); setIsMenuOpen(false); }} className="h-14 border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-white rounded-2xl">
                      Explorar como Cliente
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  {/* 🚀 TRAVA DO PAINEL MOBILE */}
                  <MobileNavItem icon={<LayoutDashboard />} label="Painel Administrativo" to="/dashboard" onClick={() => setIsMenuOpen(false)} show={role === 'barbeiro' && canSeePainel} />
                  
                  <MobileNavItem icon={<Calendar />} label="Agenda da Barbearia" to="/agendamentos" onClick={() => setIsMenuOpen(false)} show={role === 'barbeiro'} />
                  <MobileNavItem icon={<Wallet />} label="Financeiro" to="/financeiro" onClick={() => setIsMenuOpen(false)} show={role === 'barbeiro' && canSeeFinanceiro} />
                  <MobileNavItem icon={<Package />} label="Produtos" to="/produtos" onClick={() => setIsMenuOpen(false)} show={role === 'barbeiro' && canSeeProdutos} />
                  <MobileNavItem icon={<Settings />} label="Configurações" to="/dashboard/configuracoes" onClick={() => setIsMenuOpen(false)} show={role === 'barbeiro' && canSeeConfiguracoes} />
                  <MobileNavItem icon={<Users />} label="Minha Equipe" to="/equipe" onClick={() => setIsMenuOpen(false)} show={role === 'barbeiro' && canSeeEquipe} />
                  
                  <MobileNavItem icon={<Calendar />} label="Minha Agenda" to="/meus-agendamentos" onClick={() => setIsMenuOpen(false)} show={role === 'cliente'} />
                  <MobileNavItem icon={<Heart />} label="Favoritos" to="/favoritos" onClick={() => setIsMenuOpen(false)} show={role === 'cliente'} />
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 font-black uppercase italic text-destructive bg-destructive/5 rounded-2xl mt-4">
                    <LogOut className="w-5 h-5" /> Sair do BarberPro
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

function MobileNavItem({ icon, label, to, onClick, show }: any) {
  if (!show) return null;
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-4 p-4 font-black uppercase tracking-widest text-[10px] text-white/70 hover:bg-white/5 rounded-2xl transition-all">
      <span className="text-primary">{React.cloneElement(icon, { className: "w-5 h-5" })}</span>
      {label}
    </Link>
  );
}