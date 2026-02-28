import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { OccupancyRing } from "@/components/dashboard/OccupancyRing";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ClientRiskList } from "@/components/dashboard/ClientRiskList";
import { DollarSign, Users, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Olá, <span className="text-gradient-amber">Marco</span>.
          </h1>
          <p className="text-muted-foreground mt-1">Aqui está o resumo de hoje.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Revenue Card */}
          <KPICard
            label="Faturamento Hoje"
            value="R$ 1.250"
            trend={{ value: "+15% vs ontem", isPositive: true }}
            icon={<DollarSign className="h-5 w-5" />}
            highlight
          />
          
          {/* Occupancy Card */}
          <div className="kpi-card">
            <span className="kpi-label">Taxa de Ocupação</span>
            <div className="mt-4 flex items-center justify-center">
              <OccupancyRing percentage={85} size={100} strokeWidth={8} />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              17 de 20 horários preenchidos
            </p>
          </div>
          
          {/* Available Slots Card */}
          <div className="kpi-card group cursor-pointer transition-all hover:border-primary/50">
            <div className="flex items-start justify-between mb-3">
              <span className="kpi-label">Vagas Restantes Hoje</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="kpi-value mb-3">4</div>
            <Button 
              size="sm" 
              className="w-full btn-primary-glow"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Divulgar Vagas
            </Button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <RevenueChart />
          <ClientRiskList />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="card-premium p-4 text-center">
            <p className="text-2xl font-bold text-foreground">156</p>
            <p className="text-sm text-muted-foreground">Clientes este mês</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-2xl font-bold text-foreground">R$ 45</p>
            <p className="text-sm text-muted-foreground">Ticket médio</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-2xl font-bold text-foreground">4.9</p>
            <p className="text-sm text-muted-foreground">Avaliação média</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-2xl font-bold text-foreground">23</p>
            <p className="text-sm text-muted-foreground">Novos clientes</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
