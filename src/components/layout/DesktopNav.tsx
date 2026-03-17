import { Calendar, LayoutDashboard, Package, Scissors, User, Users, Wrench, Wallet, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export function DesktopNav() {
  // 🚀 Adicionamos 'currentUser' aqui para pegar o nome
  const { isAuthenticated, role, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const isBarbeiro = role === "barbeiro";
  const isCliente = role === "cliente";

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
              <NavLink to="/financeiro" className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary" activeClassName="bg-secondary text-foreground">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">Financeiro</span>
              </NavLink>
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
            <div className="flex items-center gap-4 ml-2">
              {/* 👤 Nome do Usuário Lapidado */}
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-foreground leading-none">
                  {getFirstName(currentUser?.name)}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                  {role}
                </span>
              </div>

              {/* Botão Sair com Ícone */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Sair da conta"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}