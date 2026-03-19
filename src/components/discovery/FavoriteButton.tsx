"use client"

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface FavoriteButtonProps {
  targetId: string;
  type: 'shop' | 'barber';
  initialIsFavorite?: boolean;
}

export function FavoriteButton({ targetId, type, initialIsFavorite = false }: FavoriteButtonProps) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  // 🛡️ HELPER DE ELITE: Verifica se o ID é um UUID válido do banco ou um Mock
  const isRealUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  useEffect(() => {
    const checkStatus = async () => {
      // Se não houver usuário ou o ID for um Mock ("mock-1"), não consultamos o banco
      if (!currentUser || !isRealUUID(targetId)) return;

      try {
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('target_id', targetId)
          .maybeSingle();
        
        if (data) setIsFavorite(true);
      } catch (error) {
        console.error("Erro ao checar status do favorito:", error);
      }
    };
    checkStatus();
  }, [targetId, currentUser]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!currentUser) return toast.error("Faça login para favoritar!");

    const newState = !isFavorite;
    
    // 🎨 UI OPTIMISTIC: Muda a cor na hora para o usuário sentir a fluidez
    setIsFavorite(newState);

    // 🚀 LÓGICA HÍBRIDA (MOCK VS REAL)
    if (!isRealUUID(targetId)) {
      // Se for Mock, apenas simulamos o sucesso visual para você validar o Layout
      toast.success(newState ? "Favoritado (Modo de Teste)" : "Removido (Modo de Teste)");
      return;
    }

    // Se for um ID real (UUID), aí sim vamos para o Supabase
    setLoading(true);
    try {
      if (newState) {
        const { error } = await supabase.from('user_favorites').insert({
          user_id: currentUser.id,
          target_id: targetId,
          type: type
        });
        if (error) throw error;
        toast.success("Adicionado aos favoritos!");
      } else {
        const { error } = await supabase.from('user_favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('target_id', targetId);
        if (error) throw error;
        toast.info("Removido dos favoritos");
      }

      // Invalida o cache para atualizar a Home e o Header instantaneamente
      queryClient.invalidateQueries({ queryKey: ["user-favorite-ids", currentUser.id] });
      
    } catch (error) {
      setIsFavorite(!newState); // Reverte o visual se o banco falhar
      toast.error("Erro ao atualizar favorito no banco");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="h-8 w-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all active:scale-90 shadow-sm"
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          isFavorite ? "fill-red-500 text-red-500" : "text-white"
        )}
      />
    </button>
  );
}