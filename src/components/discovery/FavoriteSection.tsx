"use client";

import React, { memo } from "react";
import { ShopCard, type Shop } from "./ShopCard";

interface FavoriteSectionProps {
  favorites: Shop[];
  favoriteIds: string[]; 
  onSelectShop: (id: string) => void;
}

export const FavoriteSection = memo(({ favorites, favoriteIds, onSelectShop }: FavoriteSectionProps) => {
  if (!favorites || favorites.length === 0) return null;

  return (
    <section className="animate-in fade-in duration-700 delay-150">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Seus Favoritos
        </h3>
      </div>

      {/* 🚀 O MESMO GRID DA SEÇÃO DE ELITE: lg:grid-cols-3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((shop) => (
          <ShopCard 
            key={shop.id} 
            shop={shop} 
            onSelect={onSelectShop}
            isFavorite={Array.isArray(favoriteIds) && favoriteIds.includes(shop.id)}
          />
        ))}
      </div>
    </section>
  );
});

FavoriteSection.displayName = "FavoriteSection";