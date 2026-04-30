import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddProductModal({ open, onOpenChange, onSuccess }: AddProductModalProps) {
  const { currentUser } = useAuth();
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("5");

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.barbearia_id) throw new Error("Usuário não vinculado a uma barbearia");

      const { error } = await supabase.from("products").insert({
        barbearia_id: currentUser.barbearia_id,
        name,
        category,
        price: parseFloat(price.replace(",", ".")),
        stock: parseInt(stock),
        low_stock_threshold: parseInt(threshold),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Produto cadastrado com sucesso! 📦" });
      // Limpa os campos
      setName(""); setCategory(""); setPrice(""); setStock(""); setThreshold("5");
      onSuccess(); // Invalida o cache e recarrega a lista
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Novo Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pomada Matte" required className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Finalizadores" className="bg-secondary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque Inicial *</Label>
              <Input id="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" required className="bg-secondary" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Alerta de Estoque Baixo (Mínimo)</Label>
            <Input id="threshold" type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="bg-secondary" />
          </div>

          <Button type="submit" className="w-full btn-primary-glow mt-2" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Salvando..." : "Salvar Produto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}