import { AppLayout } from "@/components/layout/AppLayout";
import { WalletSummary } from "@/components/financial/WalletSummary";
import { SplitDonutChart } from "@/components/financial/SplitDonutChart";
import { TransactionTable, Transaction } from "@/components/financial/TransactionTable";
import { PayoutHistory, Payout } from "@/components/financial/PayoutHistory";
import { toast } from "sonner";

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2026-02-03",
    clientName: "Carlos Eduardo",
    totalValue: 85,
    status: "Pago",
    shopAmount: 34,
    barberName: "João",
    barberAmount: 51,
  },
  {
    id: "2",
    date: "2026-02-03",
    clientName: "Marcos Silva",
    totalValue: 120,
    status: "Pago",
    shopAmount: 48,
    barberName: "Pedro",
    barberAmount: 72,
  },
  {
    id: "3",
    date: "2026-02-02",
    clientName: "Roberto Santos",
    totalValue: 65,
    status: "Pendente",
    shopAmount: 26,
    barberName: "João",
    barberAmount: 39,
  },
  {
    id: "4",
    date: "2026-02-02",
    clientName: "Lucas Ferreira",
    totalValue: 95,
    status: "Pago",
    shopAmount: 38,
    barberName: "André",
    barberAmount: 57,
  },
  {
    id: "5",
    date: "2026-02-01",
    clientName: "Felipe Costa",
    totalValue: 45,
    status: "Estornado",
    shopAmount: 18,
    barberName: "Pedro",
    barberAmount: 27,
  },
];

const mockPayouts: Payout[] = [
  {
    id: "1",
    date: "2026-01-31",
    amount: 2850,
    status: "success",
    bankInfo: "Nubank •••• 4521",
  },
  {
    id: "2",
    date: "2026-01-15",
    amount: 3200,
    status: "success",
    bankInfo: "Nubank •••• 4521",
  },
  {
    id: "3",
    date: "2025-12-31",
    amount: 2650,
    status: "success",
    bankInfo: "Nubank •••• 4521",
  },
];

export default function Financial() {
  const handleWithdraw = () => {
    toast.success("Solicitação de saque enviada!", {
      description: "Você receberá o valor em até 2 dias úteis.",
    });
  };

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus ganhos e comissões
          </p>
        </div>

        {/* Wallet Summary */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <WalletSummary
            availableBalance={3450}
            monthlyEarnings={12580}
            monthlyGrowth={12}
            onWithdraw={handleWithdraw}
          />
        </div>

        {/* Split Chart */}
        <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <SplitDonutChart
            data={{
              shopShare: 5032,
              barberShare: 7548,
            }}
          />
        </div>

        {/* Transaction Table */}
        <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <TransactionTable transactions={mockTransactions} />
        </div>

        {/* Payout History */}
        <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <PayoutHistory payouts={mockPayouts} />
        </div>
      </div>
    </AppLayout>
  );
}
