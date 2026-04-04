import { Calendar, LayoutDashboard, Package, Scissors, User, Wallet, LogOut, ChevronDown } from "lucide-react";
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
  // 🚀 Adicionamos 'currentUser' aqui para pegar o nome
  const { isAuthenticated, role, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const isBarbeiro = role === "barbeiro";
  const isAdminBarber = isBarbeiro && currentUser?.is_admin;

  // ✨ Função para pegar apenas os dois primeiros nomes
  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return "Usuário";
    const names = fullName.trim().split(/\s+/);
    return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
  };

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-amber flex items-center justify-center">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">BarberPro</span>
        </div>

        {/* Links de Navegação */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/agendar"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
            activeClassName="bg-secondary text-foreground"
          >
            <Scissors className="h-4 w-4" />
            <span className="text-sm font-medium">Agendar</span>
          </NavLink>

          {isBarbeiro && (
            <>
              <NavLink to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary" activeClassName="bg-secondary text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </NavLink>
              <NavLink to="/agendamentos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary" activeClassName="bg-secondary text-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Agendamentos</span>
              </NavLink>
              {isAdminBarber && (
                <>
                  <NavLink to="/financeiro" className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary" activeClassName="bg-secondary text-foreground">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm font-medium">Financeiro</span>
                  </NavLink>
                  <NavLink to="/produtos" className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary" activeClassName="bg-secondary text-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-medium">Produtos</span>
                  </NavLink>
                </>
              )}
            </>
          )}

          {/* Divisor Visual */}
          <div className="w-[1px] h-6 bg-border mx-2" />

          {/* Lógica de Autenticação / Nome do Usuário */}
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
            <div className="flex items-center gap-3 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2 py-1.5 pr-3 hover:bg-secondary/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">
                        {(currentUser?.name || "U")
                          .split(/\s+/)
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-sm font-bold text-foreground leading-none max-w-[140px] truncate">
                        {getFirstName(currentUser?.name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                        {role}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(isBarbeiro ? "/perfil/barbeiro" : "/perfil/cliente")
                    }
                    className="cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Meu perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
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