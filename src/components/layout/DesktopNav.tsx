 import { Calendar, LayoutDashboard, Package, Scissors, Wallet } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export function DesktopNav() {
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
          <NavLink
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
            activeClassName="bg-secondary text-foreground"
          >
            <Scissors className="h-4 w-4" />
            <span className="text-sm font-medium">Agendar</span>
          </NavLink>
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
            activeClassName="bg-secondary text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
          <NavLink
            to="/agenda"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground transition-all hover:bg-secondary"
            activeClassName="bg-secondary text-foreground"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Agenda</span>
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
        </div>
      </div>
    </nav>
  );
}
