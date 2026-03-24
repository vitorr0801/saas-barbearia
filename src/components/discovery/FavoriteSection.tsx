"use client";

import React, { memo } from "react";
import { ShopCard } from "./ShopCard";

interface FavoriteSectionProps {
  favorites: any[];
  // 🎯 A CHAVE: Recebe os IDs para sincronizar o estado visual dos corações
  favoriteIds: string[]; 
  onSelectShop: (id: string) => void;
}

/**
 * 🚀 PADRÃO TOP MUNDIAL:
 * O 'memo' é essencial aqui para evitar que o carrossel horizontal sofra "re-renders"
 * pesados toda vez que o usuário digita algo na barra de busca da Home.
 */
export const FavoriteSection = memo(({ favorites, favoriteIds, onSelectShop }: FavoriteSectionProps) => {
  // 🛡️ Guard Clause de Performance
  if (!favorites || favorites.length === 0) return null;

  return (
    <section className="animate-in fade-in duration-700 delay-150">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Seus Favoritos
        </h3>
      </div>

      {/* 📱 UX DE ELITE (Mobile Friendly):
         Uso de snap-x para que o carrossel "trave" na barbearia ao rolar lateralmente.
      */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 snap-x touch-pan-x">
        {favorites.map((shop) => (
          <div key={shop.id} className="min-w-[280px] md:min-w-[320px] snap-start">
            <ShopCard 
              shop={shop} 
              onSelect={onSelectShop}
              // 🎯 SINCRONIA: O ShopCard agora sabe se está favoritado comparando os IDs
              isFavorite={Array.isArray(favoriteIds) && favoriteIds.includes(shop.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

FavoriteSection.displayName = "FavoriteSection";