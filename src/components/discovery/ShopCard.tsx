"use client"

import React from "react"
import { Star, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { FavoriteButton } from "./FavoriteButton" 
import { cn } from "@/lib/utils"

export interface Shop {
  id: string;
  name: string;
  image?: string;      
  coverImage?: string; 
  rating: number;
  reviewCount?: number;
  neighborhood: string;
  startingPrice: number;
  categories: string[];
}

interface ShopCardProps {
  shop: Shop;
  isFavorite: boolean; 
  onSelect: (shopId: string) => void;
}

export function ShopCard({ shop, onSelect, isFavorite }: ShopCardProps) {
  const displayImage = shop.image || shop.coverImage || null;

  return (
    <Card
      className="group h-full flex flex-col bg-[#0a0c12]/40 backdrop-blur-md border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] rounded-[2.5rem]"
      onClick={() => onSelect(shop.id)}
    >
      <div className="shrink-0">
        <AspectRatio ratio={16 / 10}>
          <div className="w-full h-full relative overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage}
                alt={`Foto da ${shop.name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  Sem foto
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-transparent to-transparent opacity-80" />
            
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <Badge className="bg-black/60 backdrop-blur-xl text-white border-white/10 gap-1.5 h-9 px-3 shadow-xl">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-[11px] font-black">{shop.rating.toFixed(1)}</span>
              </Badge>

              <FavoriteButton 
                targetId={shop.id} 
                type="shop" 
                isFavorite={isFavorite} 
              />
            </div>
          </div>
        </AspectRatio>
      </div>

      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors line-clamp-1">
              {shop.name}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest truncate">{shop.neighborhood}</span>
            </div>
          </div>

          {/* 🚀 OTIMIZAÇÃO MUNDIAL: Array cortado para mostrar no máximo 3 especialidades */}
          {Array.isArray(shop.categories) && shop.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shop.categories.slice(0, 3).map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className={cn(
                    "bg-white/10 backdrop-blur-md border-white/10 whitespace-nowrap shrink-0",
                    "text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 text-white/90",
                  )}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Investimento</span>
            <span className="text-sm font-black text-primary italic">
              R$ {shop.startingPrice}
            </span>
          </div>
          
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all duration-500">
            <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover:bg-primary-foreground animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}