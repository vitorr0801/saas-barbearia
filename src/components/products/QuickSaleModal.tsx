 import { useState } from "react";
 import { Check, Zap, Store, User } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { cn } from "@/lib/utils";
 import { toast } from "@/hooks/use-toast";
 
 interface Product {
   id: string;
   name: string;
   price: number;
 }
 
 interface QuickSaleModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   product: Product | null;
 }
 
 type PaymentMethod = "pix" | "card" | "cash";
 
 const mockClients = [
   { id: "1", name: "João Silva" },
   { id: "2", name: "Pedro Santos" },
   { id: "3", name: "Carlos Oliveira" },
   { id: "4", name: "Lucas Souza" },
   { id: "walk-in", name: "Cliente Avulso" },
 ];
 
 export function QuickSaleModal({ open, onOpenChange, product }: QuickSaleModalProps) {
   const [selectedClient, setSelectedClient] = useState<string>("");
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat("pt-BR", {
       style: "currency",
       currency: "BRL",
     }).format(value);
   };
 
   const handleConfirmSale = () => {
     if (!selectedClient) {
       toast({
         title: "Selecione um cliente",
         description: "É necessário selecionar um cliente para finalizar a venda.",
         variant: "destructive",
       });
       return;
     }
 
     toast({
       title: "Venda Registrada! ✅",
       description: `${product?.name} vendido com sucesso.`,
     });
     
     // Reset and close
     setSelectedClient("");
     setPaymentMethod("pix");
     onOpenChange(false);
   };
 
   if (!product) return null;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md bg-background border-border">
         <DialogHeader>
           <DialogTitle className="text-foreground">Venda Rápida</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-5 py-2">
           {/* Product Summary */}
           <div className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
             <div>
               <p className="font-semibold text-foreground">{product.name}</p>
               <p className="text-xs text-muted-foreground">1 unidade</p>
             </div>
             <p className="text-xl font-bold text-primary">
               {formatCurrency(product.price)}
             </p>
           </div>
 
           {/* Client Selection */}
           <div className="space-y-2">
             <label className="text-sm font-medium text-foreground flex items-center gap-2">
               <User className="h-4 w-4 text-muted-foreground" />
               Cliente
             </label>
             <Select value={selectedClient} onValueChange={setSelectedClient}>
               <SelectTrigger className="w-full bg-secondary border-border">
                 <SelectValue placeholder="Selecionar cliente..." />
               </SelectTrigger>
               <SelectContent>
                 {mockClients.map((client) => (
                   <SelectItem key={client.id} value={client.id}>
                     {client.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Payment Method */}
           <div className="space-y-2">
             <label className="text-sm font-medium text-foreground">
               Forma de Pagamento
             </label>
             <div className="grid grid-cols-3 gap-2">
               <button
                 onClick={() => setPaymentMethod("pix")}
                 className={cn(
                   "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                   paymentMethod === "pix"
                     ? "border-primary bg-primary/10"
                     : "border-border bg-secondary/50 hover:bg-secondary"
                 )}
               >
                 <Zap className={cn(
                   "h-5 w-5 mb-1",
                   paymentMethod === "pix" ? "text-primary" : "text-muted-foreground"
                 )} />
                 <span className="text-xs font-medium text-foreground">Pix</span>
               </button>
 
               <button
                 onClick={() => setPaymentMethod("card")}
                 className={cn(
                   "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                   paymentMethod === "card"
                     ? "border-primary bg-primary/10"
                     : "border-border bg-secondary/50 hover:bg-secondary"
                 )}
               >
                 <svg
                   className={cn(
                     "h-5 w-5 mb-1",
                     paymentMethod === "card" ? "text-primary" : "text-muted-foreground"
                   )}
                   fill="none"
                   viewBox="0 0 24 24"
                   stroke="currentColor"
                 >
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
                 <span className="text-xs font-medium text-foreground">Cartão</span>
               </button>
 
               <button
                 onClick={() => setPaymentMethod("cash")}
                 className={cn(
                   "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                   paymentMethod === "cash"
                     ? "border-primary bg-primary/10"
                     : "border-border bg-secondary/50 hover:bg-secondary"
                 )}
               >
                 <Store className={cn(
                   "h-5 w-5 mb-1",
                   paymentMethod === "cash" ? "text-primary" : "text-muted-foreground"
                 )} />
                 <span className="text-xs font-medium text-foreground">Dinheiro</span>
               </button>
             </div>
           </div>
 
           {/* Confirm Button */}
           <Button
             onClick={handleConfirmSale}
             className="w-full h-12 btn-primary-glow text-base font-semibold"
           >
             <Check className="h-5 w-5 mr-2" />
             Confirmar Venda
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }