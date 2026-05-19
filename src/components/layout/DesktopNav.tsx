"use client"

import React, { useMemo } from "react";
import { Calendar, Scissors, User, LogOut, ChevronDown, Heart, LayoutDashboard, Compass } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DesktopNav() {
  const { isAuthenticated, role, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const isBarbeiro = role === "barbeiro";
  const isCliente = role === "cliente";

  // Formatação limpa do cargo/papel
  const displayJob = isBarbeiro ? (currentUser?.job_title || "Barbeiro") : "Cliente Elite";

  // 🚀 TIER-1: Extrator de Iniciais de Alta Performance
  const displayInitials = useMemo(() => {
    if (!currentUser?.name) return "U";
    const tokens = currentUser.name.trim().split(/\s+/);
    if (tokens.length === 0) return "U";
    if (tokens.length === 1) return (tokens[0][0] || "U").toUpperCase();
    
    const firstInitial = tokens[0][0] || "";
    const lastInitial = tokens[tokens.length - 1][0] || "";
    
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [currentUser?.name]);

  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return "Usuário";
    const names = fullName.trim().split(/\s+/);
    return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
  };

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
        {/* LOGO */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-black text-lg tracking-tighter uppercase italic">
            Barber<span className="text-primary">Pro</span>
          </span>
        </div>

        {/* NAVEGAÇÃO CENTRAL (Foco total no Cliente) */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/descobrir"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            activeClassName="bg-secondary text-foreground font-bold"
          >
            <Compass className="h-4 w-4" />
            <span className="text-sm font-medium">Explorar</span>
          </NavLink>

          {isCliente && (
            <>
              <NavLink
                to="/meus-agendamentos"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                activeClassName="bg-secondary text-foreground font-bold"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Minha Agenda</span>
              </NavLink>

              <NavLink
                to="/favoritos"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                activeClassName="bg-secondary text-foreground font-bold"
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">Favoritos</span>
              </NavLink>
            </>
          )}

          {/* 🚀 Ponte B2B: Se for barbeiro navegando no app do cliente, permite voltar ao Painel */}
          {isBarbeiro && (
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary/70 transition-all hover:bg-primary/10 hover:text-primary"
              activeClassName="bg-primary/10 text-primary font-bold"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm font-medium">Painel B2B</span>
            </NavLink>
          )}

          <div className="w-[1px] h-6 bg-border mx-2" />

          {/* ÁREA DO USUÁRIO */}
          {!isAuthenticated ? (
            <NavLink
              to="/login-cliente"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
              activeClassName="bg-secondary text-foreground"
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Entrar</span>
            </NavLink>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2 py-1.5 pr-3 hover:bg-secondary/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary group"
                  >
                    <Avatar className="h-9 w-9 border border-border group-hover:border-primary/50 transition-colors">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold tracking-wider">
                        {displayInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-sm font-bold text-foreground leading-none max-w-[140px] truncate">
                        {getFirstName(currentUser?.name)}
                      </span>
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 group-hover:text-primary/70 transition-colors">
                        {displayJob}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block group-hover:text-foreground transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-52 rounded-xl border-white/10 bg-[#0a0c12]/95 backdrop-blur-xl">
                  <DropdownMenuItem
                    onClick={() => navigate(isBarbeiro ? "/perfil/barbeiro" : "/perfil/cliente")}
                    className="cursor-pointer font-medium hover:bg-white/5 focus:bg-white/5"
                  >
                    <User className="h-4 w-4 mr-2 text-muted-foreground" /> Meu perfil
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-white/5" />
                  
                  <DropdownMenuItem
                    onClick={() => { logout(); navigate("/"); }}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-bold"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}