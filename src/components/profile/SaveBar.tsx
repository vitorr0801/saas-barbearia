"use client"

import { Button } from "@/components/ui/button";
import { Save, Check, Loader2 } from "lucide-react"; // Adicionei o Loader2 para um feedback melhor
import { useState } from "react";

interface SaveBarProps {
  visible: boolean;
  onSave: () => Promise<void>; // 👈 Mudamos para Promise para podermos dar 'await'
  isLoading?: boolean;         // 👈 A prop que o TypeScript estava reclamando
}

export function SaveBar({ visible, onSave, isLoading }: SaveBarProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  if (!visible) return null;

  const handleInternalSave = async () => {
    try {
      // 1. Executa a função real de salvar que vem do ClientProfile (Supabase)
      await onSave(); 
      
      // 2. Se não deu erro no banco, mostramos o check de sucesso
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      // O erro já é tratado no toast do componente pai, 
      // então aqui apenas garantimos que o 'showSuccess' não apareça.
      console.error("Erro capturado no SaveBar:", error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg p-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-lg mx-auto">
        <Button
          onClick={handleInternalSave}
          disabled={isLoading || showSuccess}
          className="w-full h-12 text-base font-semibold gap-2 btn-primary-glow"
        >
          {showSuccess ? (
            <>
              <Check className="h-5 w-5" />
              Salvo com Sucesso!
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}