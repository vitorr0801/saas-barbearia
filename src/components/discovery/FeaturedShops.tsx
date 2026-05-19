"use client"

import React, { memo } from "react";
import { ShopCard } from "./ShopCard";

// 🛡️ Interface unificada para garantir que o TS não reclame dos tipos
interface Shop {
  id: string;
  name: string;
  image?: string;      // ⬅️ Padronizado para 'image' (visto no ClientPortal)
  coverImage?: string; // ⬅️ Fallback para 'coverImage' (caso venha do DB assim)
  rating: number;
  reviewCount?: number;
  neighborhood: string;
  startingPrice: number;
  categories: string[];
}

interface FeaturedShopsProps {
  shops: Shop[];
  favoriteIds: string[]; // 🎯 A prop que faltava para curar o erro do terminal
  onSelectShop: (shopId: string) => void;
}

/**
 * 🚀 PADRÃO TOP MUNDIAL:
 * O uso do 'memo' aqui é crucial porque a lista de barbearias pode ser grande.
 * Isso evita que o React re-renderize 20+ cards de barbearia cada vez que 
 * você digita uma letra na barra de pesquisa.
 */
export const FeaturedShops = memo(({ shops, favoriteIds, onSelectShop }: FeaturedShopsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {shops.map((shop) => (
        <ShopCard 
          key={shop.id} 
          shop={shop} 
          onSelect={onSelectShop} 
          // 🎯 O PENTE FINO: Sincronia absoluta do coração
          isFavorite={Array.isArray(favoriteIds) && favoriteIds.includes(shop.id)}
        />
      ))}
    </div>
  );
});

FeaturedShops.displayName = "FeaturedShops";