import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WalletSummaryProps {
  availableBalance: number;
  monthlyEarnings: number;
  monthlyGrowth: number;
  onWithdraw: () => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function WalletSummary({
  availableBalance,
  monthlyEarnings,
  monthlyGrowth,
  onWithdraw,
}: WalletSummaryProps) {
  const isPositiveGrowth = monthlyGrowth >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Available Balance Card */}
      <div className="card-premium p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Saldo Disponível para Saque
            </span>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-primary mb-4">
            {formatCurrency(availableBalance)}
          </p>
          <Button 
            onClick={onWithdraw}
            className="w-full btn-primary-glow"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Sacar agora
          </Button>
        </div>
      </div>

      {/* Monthly Earnings Card */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Ganhos Totais do Mês
          </span>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {formatCurrency(monthlyEarnings)}
        </p>
        <div className={cn(
          "inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          isPositiveGrowth 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          <TrendingUp className={cn(
            "h-3 w-3",
            !isPositiveGrowth && "rotate-180"
          )} />
          <span>
            {isPositiveGrowth ? "+" : ""}{monthlyGrowth}% vs mês anterior
          </span>
        </div>
      </div>
    </div>
  );
}
