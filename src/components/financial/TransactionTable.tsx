import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  date: string;
  clientName: string;
  totalValue: number;
  status: "Pago" | "Pendente" | "Estornado";
  shopAmount: number;
  barberName: string;
  barberAmount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
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
  });
}

const statusStyles = {
  Pago: "bg-success/10 text-success border-success/20",
  Pendente: "bg-warning/10 text-warning border-warning/20",
  Estornado: "bg-destructive/10 text-destructive border-destructive/20",
};

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground font-medium w-16 shrink-0">
            {formatDate(transaction.date)}
          </span>
          <span className="text-sm font-medium text-foreground truncate">
            {transaction.clientName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={cn("text-xs", statusStyles[transaction.status])}
          >
            {transaction.status}
          </Badge>
          <span className="text-sm font-semibold text-foreground w-24 text-right">
            {formatCurrency(transaction.totalValue)}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Split Detail */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 bg-accent/5 animate-fade-in">
          <div className="rounded-lg bg-background/50 border border-border/30 p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Detalhamento da Divisão
            </p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground">Barbearia recebe:</span>
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(transaction.shopAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground">
                {transaction.barberName} recebe:
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(transaction.barberAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
        {transactions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
}
