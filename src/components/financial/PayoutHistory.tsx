import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Payout {
  id: string;
  date: string;
  amount: number;
  status: "success" | "pending" | "failed";
  bankInfo: string;
}

interface PayoutHistoryProps {
  payouts: Payout[];
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    label: "Concluído",
    className: "text-success",
  },
  pending: {
    icon: Clock,
    label: "Processando",
    className: "text-warning",
  },
  failed: {
    icon: XCircle,
    label: "Falhou",
    className: "text-destructive",
  },
};

export function PayoutHistory({ payouts }: PayoutHistoryProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          Histórico de Saques
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {payouts.map((payout) => {
            const config = statusConfig[payout.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={payout.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon className={cn("h-5 w-5", config.className)} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(payout.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payout.bankInfo}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payout.date)}
                  </p>
                  <p className={cn("text-xs font-medium", config.className)}>
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {payouts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum saque realizado ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}
