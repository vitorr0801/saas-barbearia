import { Package, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Product } from "./ProductList";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, iconBg, subtitle }: StatCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryStats() {
  const { currentUser } = useAuth();

  // A MÁGICA: Como a queryKey é a mesma, ele não faz outra requisição, ele pega do cache!
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products", currentUser?.barbearia_id],
    enabled: !!currentUser?.barbearia_id,
  });

  // Busca rapidamente a tabela de vendas para achar o mais vendido
  const { data: sales = [] } = useQuery({
    queryKey: ["sales", currentUser?.barbearia_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("product_id")
        .eq("barbearia_id", currentUser?.barbearia_id);
      return data || [];
    },
    enabled: !!currentUser?.barbearia_id,
  });

  // 1. Cálculo de Valor Total em Estoque (Preço x Quantidade)
  const totalValue = products.reduce((acc, product) => acc + (product.price * product.stock), 0);

  // 2. Contagem de Estoque Baixo
  const lowStockCount = products.filter((p) => p.stock <= p.low_stock_threshold).length;

  // 3. Descobrir o Mais Vendido
  let topSellerName = "Nenhuma venda";
  let topSellerCount = 0;

  if (sales.length > 0 && products.length > 0) {
    const counts: Record<string, number> = {};
    sales.forEach(sale => {
      counts[sale.product_id] = (counts[sale.product_id] || 0) + 1;
    });
    
    // Acha o ID com mais vendas
    const topProductId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    topSellerCount = counts[topProductId];
    topSellerName = products.find(p => p.id === topProductId)?.name || "Desconhecido";
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Total em Estoque"
        value={formatCurrency(totalValue)}
        icon={<Package className="h-5 w-5 text-primary" />}
        iconBg="bg-primary/20"
        subtitle={`${products.length} itens catalogados`}
      />
      <StatCard
        title="Estoque Baixo"
        value={lowStockCount.toString()}
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        iconBg="bg-destructive/20"
        subtitle="Precisam de reposição"
      />
      <StatCard
        title="Mais Vendido"
        value={topSellerName}
        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        iconBg="bg-emerald-500/20"
        subtitle={`${topSellerCount} vendas registradas`}
      />
    </div>
  );
}