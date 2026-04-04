"use client";

import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { OccupancyRing } from "@/components/dashboard/OccupancyRing";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ClientRiskList } from "@/components/dashboard/ClientRiskList";
import { DollarSign, Users, Megaphone, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(/\s+/)[0] ?? "Barbeiro";
  const isAdmin = Boolean(currentUser?.is_admin);

  return (
    <AppLayout>
      <div className="container max-w-6xl py-5 md:py-6 space-y-5">
        <div className="animate-fade-in">
          <h1 className="text-lg md:text-xl font-black uppercase italic tracking-tight text-foreground">
            Olá, <span className="text-primary">{firstName}</span>.
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Aqui está o resumo de hoje.
          </p>
          {!isAdmin && (
            <p className="mt-3 text-xs text-muted-foreground rounded-xl border border-border bg-card px-3 py-2.5">
              Você está no modo <strong className="text-foreground">profissional</strong>. Opções de gestão
              (financeiro, produtos) ficam disponíveis apenas para o dono da barbearia.
            </p>
          )}
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          {isAdmin ? (
            <KPICard
              label="Faturamento Hoje"
              value="R$ 1.250"
              trend={{ value: "+15% vs ontem", isPositive: true }}
              icon={<DollarSign className="h-5 w-5" />}
              highlight
            />
          ) : (
            <div className="dash-card flex flex-col justify-center items-center text-center py-5">
              <LayoutDashboard className="h-7 w-7 text-primary mb-2 opacity-90" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Painel do profissional
              </span>
              <p className="text-xs text-muted-foreground mt-2 px-2 leading-relaxed">
                Acompanhe sua agenda e atendimentos. Métricas financeiras são do dono.
              </p>
            </div>
          )}

          <div className="dash-card">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Taxa de Ocupação
            </span>
            <div className="mt-3 flex items-center justify-center">
              <OccupancyRing percentage={85} size={100} strokeWidth={8} />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              17 de 20 horários preenchidos
            </p>
          </div>

          <div className="dash-card transition-colors hover:border-primary/25">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Vagas Restantes Hoje
              </span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">4</div>
            {isAdmin && (
              <Button
                size="sm"
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold uppercase text-[10px] tracking-wide shadow-none hover:bg-primary/90"
              >
                <Megaphone className="h-3.5 w-3.5 mr-2" />
                Divulgar Vagas
              </Button>
            )}
          </div>
        </div>

        {isAdmin && (
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <RevenueChart />
            <ClientRiskList />
          </div>
        )}

        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-fade-in ${isAdmin ? "" : "opacity-90"}`}
          style={{ animationDelay: "300ms" }}
        >
          {(isAdmin
            ? [
                { v: "156", l: "Clientes este mês" },
                { v: "R$ 45", l: "Ticket médio" },
                { v: "4.9", l: "Avaliação média" },
                { v: "23", l: "Novos clientes" },
              ]
            : [
                { v: "—", l: "Atendimentos hoje" },
                { v: "—", l: "Próximos" },
                { v: "—", l: "Avaliação" },
                { v: "—", l: "Meta semanal" },
              ]
          ).map((item) => (
            <div key={item.l} className="dash-card text-center py-3 md:py-4">
              <p className="text-xl md:text-2xl font-bold text-foreground">{item.v}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 leading-tight">{item.l}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
