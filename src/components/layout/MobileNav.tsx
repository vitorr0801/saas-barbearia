import { Calendar, LayoutDashboard, Package, Scissors, Wallet } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export function MobileNav() {
  const { role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isBarbeiro = role === "barbeiro";
  const isCliente = role === "cliente";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {/* Agendar */}
        <NavLink
          to="/agendar"
          className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Scissors className="h-5 w-5" />
          <span className="text-xs font-medium">Agendar</span>
        </NavLink>

        {/* Navegação do barbeiro */}
        {isBarbeiro && (
          <>
            <NavLink
              to="/dashboard"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors"
              activeClassName="text-primary"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs font-medium">Dashboard</span>
            </NavLink>
            <NavLink
              to="/agendamentos"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors"
              activeClassName="text-primary"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">Agendamentos</span>
            </NavLink>
            <NavLink
              to="/financeiro"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors"
              activeClassName="text-primary"
            >
              <Wallet className="h-5 w-5" />
              <span className="text-xs font-medium">Financeiro</span>
            </NavLink>
            <NavLink
              to="/produtos"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors"
              activeClassName="text-primary"
            >
              <Package className="h-5 w-5" />
              <span className="text-xs font-medium">Produtos</span>
            </NavLink>
          </>
        )}

        {/* Sair (cliente ou barbeiro) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="text-xs font-medium text-muted-foreground px-3 py-2"
          >
            Sair
          </button>
        )}
      </div>
    </nav>
  );
}
