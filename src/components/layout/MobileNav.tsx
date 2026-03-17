import { Calendar, LayoutDashboard, Package, Scissors, Wallet, User, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export function MobileNav() {
  // 🚀 Buscando o currentUser para mostrar o nome no celular
  const { role, isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const isBarbeiro = role === "barbeiro";

  // ✨ A mesma regra dos dois nomes para manter o padrão
  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return "Perfil";
    const names = fullName.trim().split(/\s+/);
    return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden pb-safe">
      <div className="flex items-center justify-around py-2">
        
        {/* Agendar - Sempre visível */}
        <NavLink
          to="/agendar"
          className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Scissors className="h-5 w-5" />
          <span className="text-[10px] font-medium">Agendar</span>
        </NavLink>

        {/* Navegação específica do Barbeiro */}
        {isBarbeiro && (
          <>
            <NavLink
              to="/dashboard"
              className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors"
              activeClassName="text-primary"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] font-medium">Painel</span>
            </NavLink>
            <NavLink
              to="/agendamentos"
              className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors"
              activeClassName="text-primary"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-[10px] font-medium">Agenda</span>
            </NavLink>
          </>
        )}

        {/* Área do Usuário (Nome + Logout) */}
        {!isAuthenticated ? (
          <NavLink
            to="/cadastro"
            className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Entrar</span>
          </NavLink>
        ) : (
          <div className="flex items-center">
            {/* Link para o Perfil com o Nome Curto */}
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

            {/* Botão de Sair Compacto */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
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