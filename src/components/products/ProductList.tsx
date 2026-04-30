import { useState } from "react";
import { ShoppingCart, ImageIcon, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuickSaleModal } from "./QuickSaleModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // <-- Adicionamos o useQueryClient aqui
import { formatCurrency } from "@/lib/currency";
import { AddProductModal } from "@/components/products/AddProductModal";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
}

export function ProductList() {
  const { currentUser } = useAuth();
  
  // Inicia o QueryClient para podermos manipular o cache
  const queryClient = useQueryClient(); 
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Busca os produtos
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", currentUser?.barbearia_id],
    queryFn: async () => {
      if (!currentUser?.barbearia_id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barbearia_id", currentUser.barbearia_id)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentUser?.barbearia_id,
  });

  // FUNÇÃO MESTRA: Atualiza a tela toda quando algo muda
  const handleUpdateEverything = () => {
    // Invalida os caches, forçando os gráficos e listas a buscarem os dados novos do Supabase
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["sales-total"] });
  };

  const handleQuickSell = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const isLowStock = (product: Product) => product.stock <= product.low_stock_threshold;

  if (isLoading) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Carregando produtos...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Produtos</h2>
          <Button onClick={() => setIsAddModalOpen(true)} variant="outline" size="sm" className="text-xs">
            + Adicionar Produto
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card border-dashed">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "bg-card border rounded-xl p-4 space-y-3 transition-all",
                  isLowStock(product)
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border"
                )}
              >
                {/* Product Image Placeholder */}
                <div className="aspect-square bg-secondary rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">
                      {product.name}
                    </h3>
                    {isLowStock(product) && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                        Baixo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>

                {/* Price and Stock */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isLowStock(product) ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {product.stock} em estoque
                  </span>
                </div>

                {/* Quick Sell Button */}
                <Button
                  onClick={() => handleQuickSell(product)}
                  className="w-full btn-primary-glow"
                  size="sm"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Venda Rápida
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickSaleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={selectedProduct}
        onSaleComplete={handleUpdateEverything} // <-- Agora avisa a tela inteira!
      />

      <AddProductModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleUpdateEverything} // <-- Agora avisa a tela inteira!
      />
    </>
  );
}