"use client"

import { ShopCard } from "./ShopCard";

interface Shop {
  id: string;
  name: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  neighborhood: string;
  startingPrice: number;
  categories: string[];
}

interface FeaturedShopsProps {
  shops: Shop[];
  onSelectShop: (shopId: string) => void;
}

export function FeaturedShops({ shops, onSelectShop }: FeaturedShopsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground italic uppercase tracking-tighter">
          Barbearias em Destaque
        </h2>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {shops.length} lugares encontrados
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shops.map((shop) => (
          /* Não precisamos mais injetar o FavoriteButton aqui manualmente.
             O ShopCard já possui o FavoriteButton integrado internamente,
             posicionado ao lado da estrela de avaliação.
          */
          <ShopCard 
            key={shop.id} 
            shop={shop} 
            onSelect={onSelectShop} 
          />
        ))}
      </div>
    </section>
  );
}