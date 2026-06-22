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
  isFavorite: boolean; 
}

export function FavoriteButton({ targetId, type, isFavorite }: FavoriteButtonProps) {
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [active, setActive] = useState(isFavorite);
  const [loading, setLoading] = useState(false);

  // Mantém o estado visual sincronizado com o que a página pai manda
  useEffect(() => {
    setActive(isFavorite);
  }, [isFavorite]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();

    if (authLoading || !isAuthenticated || !currentUser) return;

    const nextState = !active;
    const previousState = active;

    // 🚀 OPTIMISTIC UI: Feedback visual instantâneo
    setActive(nextState);
    setLoading(true);

    try {
      if (nextState) {
        const { error } = await supabase.from('user_favorites').insert({
          user_id: currentUser.id,
          target_id: targetId,
          type: type
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('target_id', targetId);
        if (error) throw error;
      }

      /** * 📡 SINCRONIZAÇÃO DE ELITE (Onde corrigimos o erro):
       * Usamos as chaves originais que você já tem no ClientPortal e no Header.
       * O 'await' garante que a interface só "destrave" após o cache ser limpo.
       */
      await Promise.all([
        // Atualiza a lista de IDs (faz o card sumir na FavoritesPage e atualizar na Home)
        queryClient.invalidateQueries({ queryKey: ["user-favorite-ids", currentUser.id] }),
        // Atualiza o contador do Header (sem dar conflito)
        queryClient.invalidateQueries({ queryKey: ["user-favorites-count", currentUser.id] })
      ]);

      toast.success(nextState ? "Favorito salvo!" : "Removido!");

    } catch (error) {
      setActive(previousState);
      toast.error("Erro ao sincronizar.");
      console.error("Erro:", error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      type="button"
      className={cn(
        "group relative h-9 w-9 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-lg",
        "bg-[#0a0c12]/60 backdrop-blur-xl border border-white/10 hover:border-primary/50",
        active && "border-primary/30",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart
        className={cn(
          "h-4.5 w-4.5 transition-all duration-300",
          active ? "fill-red-500 text-red-500 scale-110" : "text-white/70 group-hover:text-white"
        )}
      />
      {active && (
        <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping pointer-events-none" />
      )}
    </button>
  );
}