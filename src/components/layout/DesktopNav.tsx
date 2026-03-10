import { Calendar, LayoutDashboard, Package, Scissors, User, Users, Wrench, Wallet } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";

export function DesktopNav() {
  const { isAuthenticated, role, logout } = useAuth();

  const isBarbeiro = role === "barbeiro";
  const isCliente = role === "cliente";

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-amber flex items-center justify-center">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">BarberPro</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Booking - visible for everyone */}
          <NavLink
            to="/agendar"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
            activeClassName="bg-secondary text-foreground"
          >
            <Scissors className="h-4 w-4" />
            <span className="text-sm font-medium">Agendar</span>
          </NavLink>

          {/* Barber-only navigation */}
          {isBarbeiro && (
            <>
              <NavLink
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
                activeClassName="bg-secondary text-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </NavLink>
              <NavLink
                to="/agendamentos"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
                activeClassName="bg-secondary text-foreground"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Agendamentos</span>
              </NavLink>
              <NavLink
                to="/financeiro"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
                activeClassName="bg-secondary text-foreground"
              >
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Financeiro</span>
              </NavLink>
              <NavLink
                to="/produtos"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
                activeClassName="bg-secondary text-foreground"
              >
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Produtos</span>
              </NavLink>
              <NavLink
                to="/setup"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
                activeClassName="bg-secondary text-foreground"
              >
                <Wrench className="h-4 w-4" />
                <span className="text-sm font-medium">Setup</span>
              </NavLink>
              <NavLink
                to="/bancada"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
                activeClassName="bg-secondary text-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">Bancada</span>
              </NavLink>
            </>
          )}

          {/* Cliente profile link */}
          {isAuthenticated && isCliente && (
            <NavLink
              to="/perfil/cliente"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
              activeClassName="bg-secondary text-foreground"
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Meu Perfil</span>
            </NavLink>
          )}

          {/* Barbeiro profile link */}
          {isAuthenticated && isBarbeiro && (
            <NavLink
              to="/perfil/barbeiro"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
              activeClassName="bg-secondary text-foreground"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Meu Perfil</span>
            </NavLink>
          )}

          {/* Auth actions */}
          {!isAuthenticated ? (
            <NavLink
              to="/cadastro"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
              activeClassName="bg-secondary text-foreground"
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Entrar</span>
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary text-sm font-medium"
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
