 import { useState } from "react";
 import { ShoppingCart, ImageIcon } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 import { QuickSaleModal } from "./QuickSaleModal";
 
 interface Product {
   id: string;
   name: string;
   category: string;
   price: number;
   stock: number;
   lowStockThreshold: number;
 }
 
 const mockProducts: Product[] = [
   { id: "1", name: "Pomada Matte", category: "Finalizadores", price: 45, stock: 12, lowStockThreshold: 5 },
   { id: "2", name: "Óleo para Barba", category: "Barba", price: 38, stock: 3, lowStockThreshold: 5 },
   { id: "3", name: "Shampoo Antiqueda", category: "Cabelo", price: 52, stock: 8, lowStockThreshold: 5 },
   { id: "4", name: "Balm Hidratante", category: "Barba", price: 42, stock: 2, lowStockThreshold: 5 },
   { id: "5", name: "Cera Modeladora", category: "Finalizadores", price: 35, stock: 15, lowStockThreshold: 5 },
   { id: "6", name: "Tônico Capilar", category: "Cabelo", price: 65, stock: 4, lowStockThreshold: 5 },
   { id: "7", name: "Gel Extra Forte", category: "Finalizadores", price: 28, stock: 20, lowStockThreshold: 5 },
   { id: "8", name: "Kit Barba Completo", category: "Kits", price: 120, stock: 6, lowStockThreshold: 3 },
 ];
 
 export function ProductList() {
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
 
   const handleQuickSell = (product: Product) => {
     setSelectedProduct(product);
     setIsModalOpen(true);
   };
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat("pt-BR", {
       style: "currency",
       currency: "BRL",
     }).format(value);
   };
 
   const isLowStock = (product: Product) => product.stock <= product.lowStockThreshold;
 
   return (
     <>
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <h2 className="text-lg font-semibold text-foreground">Produtos</h2>
           <Button variant="outline" size="sm" className="text-xs">
             + Adicionar Produto
           </Button>
         </div>
 
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {mockProducts.map((product) => (
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
                   <h3 className="font-semibold text-foreground text-sm leading-tight">
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
       </div>
 
       <QuickSaleModal
         open={isModalOpen}
         onOpenChange={setIsModalOpen}
         product={selectedProduct}
       />
     </>
   );
 }