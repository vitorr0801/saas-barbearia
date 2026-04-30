import { AppLayout } from "@/components/layout/AppLayout";
import { InventoryStats } from "@/components/products/InventoryStats";
import { ProductList } from "@/components/products/ProductList";
import { SalesComparisonChart } from "@/components/products/SalesComparisonChart";

export default function Products() {
  return (
    <AppLayout>
      {/* Container centralizado com largura máxima */}
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seu estoque e registre vendas rapidamente
          </p>
        </div>

        {/* Inventory Stats */}
        <InventoryStats />

        {/* Sales Comparison Chart */}
        <SalesComparisonChart />

        {/* Product List with Quick Sale */}
        <ProductList />
        
      </div>
    </AppLayout>
  );
}