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
    <section className="space-y-8">
      {/* HEADER DA SEÇÃO */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground leading-none">
            Barbearias de <span className="text-primary">Elite</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
            Os melhores profissionais selecionados para você
          </p>
        </div>
        
        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            {shops.length} {shops.length === 1 ? 'Lugar' : 'Lugares'}
          </span>
        </div>
      </div>

      {/* GRID DE CARDS */}
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
    </section>
  );
});

FeaturedShops.displayName = "FeaturedShops";