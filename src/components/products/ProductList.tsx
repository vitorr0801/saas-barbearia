import { useState, useMemo } from "react";
import { ShoppingCart, Package, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QuickSaleModal } from "./QuickSaleModal";
import { AddProductModal } from "@/components/products/AddProductModal";
import { EditProductModal } from "@/components/products/EditProductModal";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/currency";
import { useProducts, type Product } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export function ProductList() {
  const queryClient = useQueryClient(); 
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: products = [], isLoading } = useProducts();

  const handleUpdateEverything = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["sales-total"] });
  };

  const handleQuickSell = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Produto excluído com sucesso. 🗑️" });
      handleUpdateEverything();
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      setProductToDelete(null);
    },
  });

  const isLowStock = (product: Product) => product.stock <= product.low_stock_threshold;

  // EXTRAÇÃO OTIMIZADA: Cria a lista de categorias únicas sem ir ao banco de dados.
  // O useMemo garante que essa conta só será refeita se a lista de produtos mudar.
  const uniqueCategories = useMemo(() => {
    const categories = products
      .map(p => p.category?.trim())
      .filter(category => category && category.length > 0);
    return Array.from(new Set(categories)).sort();
  }, [products]);

  // FILTRO DUPLO OTIMIZADO: Busca por texto E por categoria simultaneamente
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Carregando produtos...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {/* CABEÇALHO PERFEITAMENTE ALINHADO */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2">
          <h2 className="text-lg font-semibold text-foreground shrink-0">Produtos</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Input de Busca */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-9 h-10 bg-secondary/50 border-border focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Grupo de Select e Botão */}
            <div className="flex items-center w-full sm:w-auto gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[170px] h-10 bg-secondary/50 border-border focus:ring-primary transition-colors hover:bg-secondary/80">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border shadow-xl">
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                variant="outline" 
                className="h-10 px-5 shrink-0 font-medium transition-colors hover:bg-foreground hover:text-background"
              >
                + Adicionar
              </Button>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card border-dashed">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all" 
                ? "Nenhum produto encontrado para este filtro." 
                : "Nenhum produto cadastrado."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "bg-card border rounded-xl p-4 space-y-4 transition-all flex flex-col justify-between relative",
                  isLowStock(product) ? "border-destructive/50 bg-destructive/5" : "border-border"
                )}
              >
                <div className="absolute top-3 right-3 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu de opções</span>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent align="end" className="w-40 z-50 bg-popover border-border shadow-xl">
                      <DropdownMenuItem onClick={() => handleEdit(product)} className="cursor-pointer font-medium">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setProductToDelete(product)}
                        className="cursor-pointer font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1 pr-10">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    {isLowStock(product) && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">Baixo</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-2 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
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
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickSaleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={selectedProduct}
        onSaleComplete={handleUpdateEverything}
      />

      <AddProductModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleUpdateEverything}
      />

      <EditProductModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        product={productToEdit}
        onSuccess={handleUpdateEverything}
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação não pode ser desfeita. O produto <strong className="text-foreground">{productToDelete?.name}</strong> será removido permanentemente do seu estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir produto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}