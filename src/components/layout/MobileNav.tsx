import { Calendar, LayoutDashboard, Package, Scissors, Wallet, User, LogOut, Users, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export function MobileNav() {
  const { role, isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const isBarbeiro = role === "barbeiro";
  
  // 🚀 RBAC: Definição clara e à prova de falhas
  const isOwner = Boolean(currentUser?.is_admin);
  const userJob = (currentUser?.job_title || "barbeiro").toLowerCase().trim();
  
  const isManager = userJob === "gerente";
  const isSecretary = userJob === "secretária" || userJob === "secretaria";

  // 🔐 Regras de Negócio
  const canSeePainel = !(isManager || isSecretary); // 🚀 Oculta para Staff
  const canSeeFinanceiro = isOwner; 
  const canSeeEquipe = isOwner || isManager;
  const canSeeConfiguracoes = isOwner || isManager;
  const canSeeProdutos = isOwner || isManager || isSecretary;

  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return "Perfil";
    const names = fullName.trim().split(/\s+/);
    return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden pb-safe">
      <div className="flex items-center justify-around py-2 overflow-x-auto no-scrollbar px-2">
        
        <NavLink
          to="/agendar"
          className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
          activeClassName="text-primary"
        >
          <Scissors className="h-5 w-5" />
          <span className="text-[10px] font-medium">Agendar</span>
        </NavLink>

        {isBarbeiro && (
          <>
            {/* 🚀 TRAVA DO PAINEL */}
            {canSeePainel && (
              <NavLink
                to="/dashboard"
                className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
                activeClassName="text-primary"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-[10px] font-medium">Painel</span>
              </NavLink>
            )}
            
            <NavLink
              to="/agendamentos"
              className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
              activeClassName="text-primary"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-[10px] font-medium">Agenda</span>
            </NavLink>

            {canSeeProdutos && (
              <NavLink
                to="/produtos"
                className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
                activeClassName="text-primary"
              >
                <Package className="h-5 w-5" />
                <span className="text-[10px] font-medium">Produtos</span>
              </NavLink>
            )}

            {canSeeFinanceiro && (
              <NavLink
                to="/financeiro"
                className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
                activeClassName="text-primary"
              >
                <Wallet className="h-5 w-5" />
                <span className="text-[10px] font-medium">Finanças</span>
              </NavLink>
            )}

            {canSeeEquipe && (
              <NavLink
                to="/equipe"
                className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
                activeClassName="text-primary"
              >
                <Users className="h-5 w-5" />
                <span className="text-[10px] font-medium">Equipe</span>
              </NavLink>
            )}

            {canSeeConfiguracoes && (
              <NavLink
                to="/dashboard/configuracoes"
                className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
                activeClassName="text-primary"
              >
                <Settings className="h-5 w-5" />
                <span className="text-[10px] font-medium">Ajustes</span>
              </NavLink>
            )}
          </>
        )}

        {!isAuthenticated ? (
          <NavLink
            to="/cadastro"
            className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors shrink-0"
            activeClassName="text-primary"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Entrar</span>
          </NavLink>
        ) : (
          <div className="flex items-center shrink-0">
            <NavLink
              to={isBarbeiro ? "/perfil/barbeiro" : "/perfil/cliente"}
              className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors border-r border-border/50"
              activeClassName="text-primary"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate max-w-[70px]">
                {getFirstName(currentUser?.name)}
              </span>
            </NavLink>

            <button
              type="button"
              onClick={() => { logout(); navigate("/"); }}
              className="flex flex-col items-center gap-1 px-4 py-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-medium">Sair</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}