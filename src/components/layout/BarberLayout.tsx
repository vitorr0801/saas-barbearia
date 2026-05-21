"use client"

import React, { useState, useMemo } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { 
  Scissors, LayoutDashboard, Calendar, Wallet, 
  Users, Settings, LogOut, Menu, X, UserCircle, Tag, Package, ChevronDown
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BarberLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(true) 
  
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout, role, isLoading } = useAuth()

  const isOwner = Boolean(currentUser?.is_admin);
  const userJob = (currentUser?.job_title || "barbeiro").toLowerCase().trim();
  const isManager = userJob === "gerente";
  const isSecretary = userJob === "secretária" || userJob === "secretaria";

  // ✅ NOVO: lê avatar_url do AuthContext (atualizado após upload)
  const avatarUrl = currentUser?.avatar_url ?? null;

  const canSeePainel = !(isManager || isSecretary);
  const canSeeFinanceiro = isOwner;
  const canSeeEquipe = isOwner || isManager;
  const canSeeConfiguracoes = isOwner || isManager;
  const canSeeProdutos = isOwner || isManager || isSecretary;
  const canSeeServicos = isOwner || isManager || isSecretary;

  const displayName = useMemo(() => {
    if (!currentUser?.name) return "Perfil";
    return currentUser.name.split(" ")[0]; 
  }, [currentUser?.name]);

  const displayInitials = useMemo(() => {
    if (!currentUser?.name) return "U";
    const tokens = currentUser.name.trim().split(/\s+/);
    if (tokens.length === 0) return "U";
    if (tokens.length === 1) return (tokens[0][0] || "U").toUpperCase();
    return `${tokens[0][0] || ""}${tokens[tokens.length - 1][0] || ""}`.toUpperCase();
  }, [currentUser?.name]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background flex">
      
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#0a0c12] border-r border-white/5 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        
        <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
              BARBER<span className="text-primary">PRO</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 no-scrollbar">
          <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] mb-4 ml-2">Workspace</p>
          
          {canSeePainel && (
            <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Painel" isActive={location.pathname === "/dashboard"} />
          )}
          
          <NavItem to="/agendamentos" icon={<Calendar />} label="Agenda" isActive={location.pathname.startsWith("/agendamentos")} />
          
          {(canSeeServicos || canSeeProdutos) && (
            <div className="pt-2 pb-1">
              <button 
                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Tag className={cn("w-4 h-4 transition-colors", (location.pathname.startsWith("/servicos") || location.pathname.startsWith("/produtos")) ? "text-primary" : "group-hover:text-primary")} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Catálogo</span>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isCatalogOpen && "rotate-180")} />
              </button>
              
              <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isCatalogOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0")}>
                <div className="flex flex-col gap-1 pl-10 pr-2 border-l border-white/5 ml-5 py-1">
                  {canSeeServicos && (
                    <Link to="/servicos" className={cn("py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2", location.pathname.startsWith("/servicos") ? "text-primary" : "text-muted-foreground hover:text-white")}>
                      <span className="w-1 h-1 rounded-full bg-current" /> Serviços
                    </Link>
                  )}
                  {canSeeProdutos && (
                    <Link to="/produtos" className={cn("py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2", location.pathname.startsWith("/produtos") ? "text-primary" : "text-muted-foreground hover:text-white")}>
                      <span className="w-1 h-1 rounded-full bg-current" /> Produtos
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {canSeeFinanceiro && (
            <NavItem to="/financeiro" icon={<Wallet />} label="Financeiro" isActive={location.pathname.startsWith("/financeiro")} />
          )}
          
          {canSeeEquipe && (
            <NavItem to="/equipe" icon={<Users />} label="Equipe" isActive={location.pathname.startsWith("/equipe")} />
          )}

          {canSeeConfiguracoes && (
            <div className="pt-6">
               <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] mb-4 ml-2">Gestão</p>
               <NavItem to="/dashboard/configuracoes" icon={<Settings />} label="Configurações" isActive={location.pathname.startsWith("/dashboard/configuracoes")} />
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen relative">
        
        <header className="h-20 bg-[#0a0c12]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-sm sm:text-base font-black italic uppercase tracking-widest text-white/80 hidden sm:block">
              BarberPro <span className="text-primary">Workspace</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-white/5 p-1.5 pr-3 rounded-2xl transition-colors outline-none border border-transparent hover:border-white/10 group">
                <Avatar className="w-9 h-9 rounded-xl border border-white/10 group-hover:border-primary/50 transition-colors overflow-hidden">
                  {/* ✅ Mostra a foto se existir; fallback automático para iniciais */}
                  <AvatarImage
                    src={avatarUrl ?? undefined}
                    alt={displayName}
                    className="object-cover object-center w-full h-full"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold tracking-wider">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-none">{displayName}</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">{userJob}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block group-hover:text-white transition-colors" />
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/10 bg-[#0a0c12]/95 backdrop-blur-xl shadow-2xl p-2 mt-2">
                <DropdownMenuItem onClick={() => navigate("/perfil/barbeiro")} className="cursor-pointer font-bold text-xs uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/5 rounded-xl py-3 px-4">
                  <UserCircle className="w-4 h-4 mr-3 text-primary" /> Meu Perfil
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-bold text-xs uppercase tracking-widest text-destructive hover:bg-destructive/10 rounded-xl py-3 px-4">
                  <LogOut className="w-4 h-4 mr-3" /> Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[999] lg:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-sm bg-[#0a0c12] border-r border-white/10 h-full flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
              <span className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                BARBER<span className="text-primary">PRO</span>
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
               {canSeePainel && <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Painel" isActive={location.pathname === "/dashboard"} onClick={() => setIsMobileMenuOpen(false)} />}
               <NavItem to="/agendamentos" icon={<Calendar />} label="Agenda" isActive={location.pathname.startsWith("/agendamentos")} onClick={() => setIsMobileMenuOpen(false)} />
               
               {(canSeeServicos || canSeeProdutos) && (
                 <div className="py-2">
                   <div className="flex items-center gap-2 px-3 mb-2">
                     <Tag className="w-3.5 h-3.5 text-primary" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Catálogo</span>
                   </div>
                   <div className="space-y-1 pl-4 border-l border-white/5 ml-4">
                     {canSeeServicos && <NavItem to="/servicos" icon={<Scissors />} label="Serviços" isActive={location.pathname.startsWith("/servicos")} onClick={() => setIsMobileMenuOpen(false)} />}
                     {canSeeProdutos && <NavItem to="/produtos" icon={<Package />} label="Produtos" isActive={location.pathname.startsWith("/produtos")} onClick={() => setIsMobileMenuOpen(false)} />}
                   </div>
                 </div>
               )}

               {canSeeFinanceiro && <NavItem to="/financeiro" icon={<Wallet />} label="Financeiro" isActive={location.pathname.startsWith("/financeiro")} onClick={() => setIsMobileMenuOpen(false)} />}
               {canSeeEquipe && <NavItem to="/equipe" icon={<Users />} label="Equipe" isActive={location.pathname.startsWith("/equipe")} onClick={() => setIsMobileMenuOpen(false)} />}
               {canSeeConfiguracoes && <NavItem to="/dashboard/configuracoes" icon={<Settings />} label="Configurações" isActive={location.pathname.startsWith("/dashboard/configuracoes")} onClick={() => setIsMobileMenuOpen(false)} />}
            </div>

            <div className="p-4 border-t border-white/5 bg-[#0a0c12]/50">
              <Link to="/perfil/barbeiro" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-[#0a0c12] border border-white/10 flex items-center justify-center shrink-0">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate">{displayName}</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-tighter truncate">{userJob}</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest">
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function NavItem({ icon, label, to, isActive, onClick }: { icon: React.ReactNode, label: string, to: string, isActive: boolean, onClick?: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
        isActive 
          ? "bg-primary/10 text-primary font-black shadow-inner shadow-primary/5" 
          : "text-white/60 hover:bg-white/5 hover:text-white font-bold"
      )}
    >
      <span className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
      </span>
      <span className="text-[11px] uppercase tracking-widest">{label}</span>
    </Link>
  )
}