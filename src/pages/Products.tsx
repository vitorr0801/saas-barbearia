"use client";

// 🗑️ IMPORT APAGADO: import { AppLayout } from "@/components/layout/AppLayout";
import { InventoryStats } from "@/components/products/InventoryStats";
import { ProductList } from "@/components/products/ProductList";
import { SalesComparisonChart } from "@/components/products/SalesComparisonChart";
import { Package } from "lucide-react"; // Injetado para o Header Premium

export default function Products() {
  return (
    // 🚀 TAG <AppLayout> REMOVIDA PARA O CONTEÚDO FLUIR NA SIDEBAR
    <div className="container max-w-7xl mx-auto space-y-8 overflow-x-hidden">
      
      {/* 🏁 EXECUTIVE HEADER */}
      <header className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Package className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gestão de Estoque</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Catálogo de <span className="text-primary">Produtos</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Controle de inventário e PDV de vendas rápidas
          </p>
        </div>
      </header>

      {/* 🚀 COMPONENTES COM ANIMAÇÃO EM CASCATA (Staggered Entrance) */}
      <div className="space-y-8">
        
        {/* Inventory Stats (Carrega primeiro) */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <InventoryStats />
        </div>

        {/* Sales Comparison Chart (Carrega logo em seguida) */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <SalesComparisonChart />
        </div>

        {/* Product List with Quick Sale (Carrega por último) */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <ProductList />
        </div>
        
      </div>
    </div>
  );
}