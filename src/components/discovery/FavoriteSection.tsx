"use client";

import React, { memo } from "react";
import { ShopCard } from "./ShopCard";

interface FavoriteSectionProps {
  favorites: any[];
  onSelectShop: (id: string) => void;
}

// O 'memo' garante que este carrossel só renderize de novo se a lista de favoritos mudar de verdade
export const FavoriteSection = memo(({ favorites, onSelectShop }: FavoriteSectionProps) => {
  if (!favorites || favorites.length === 0) return null;

  return (
    <section className="animate-in fade-in duration-700 delay-150">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Seus Favoritos
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 snap-x touch-pan-x">
        {favorites.map((shop) => (
          <div key={shop.id} className="min-w-[280px] snap-start">
            <ShopCard shop={shop} onSelect={onSelectShop} />
          </div>
        ))}
      </div>
    </section>
  );
});

FavoriteSection.displayName = "FavoriteSection";