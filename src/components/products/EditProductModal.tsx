import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { Product } from "@/hooks/useProducts";

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

export function EditProductModal({ open, onOpenChange, product, onSuccess }: EditProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");

  // Preenche o formulário toda vez que o modal abrir com um produto diferente
  useEffect(() => {
    if (product && open) {
      setName(product.name);
      setCategory(product.category || "");
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setThreshold(product.low_stock_threshold?.toString() || "5");
    }
  }, [product, open]);

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Produto não encontrado");

      const { error } = await supabase
        .from("products")
        .update({
          name,
          category,
          price: parseFloat(price.toString().replace(",", ".")),
          stock: parseInt(stock),
          low_stock_threshold: parseInt(threshold),
        })
        .eq("id", product.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Produto atualizado com sucesso! ✏️" });
      onSuccess(); // Invalida o cache e recarrega a lista instantaneamente
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
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
    editMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Produto *</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Categoria</Label>
            <Input id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Preço (R$) *</Label>
              <Input id="edit-price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Estoque Atual *</Label>
              <Input id="edit-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required className="bg-secondary" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-threshold">Alerta de Estoque Baixo</Label>
            <Input id="edit-threshold" type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="bg-secondary" />
          </div>

          <Button type="submit" className="w-full btn-primary-glow mt-2" disabled={editMutation.isPending}>
            {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}