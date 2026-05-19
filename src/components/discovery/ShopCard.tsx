"use client"

import React from "react"
import { Star, MapPin, ArrowRight } from "lucide-react"
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
  const reviews = shop.reviewCount || 0; 

  return (
    <Card
      className="group h-full w-full flex flex-col bg-[#0a0c12]/60 backdrop-blur-md border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] rounded-[2.5rem]"
      onClick={() => onSelect(shop.id)}
    >
      <div className="shrink-0 w-full">
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
              <div className="w-full h-full bg-[#12141a] flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  Sem foto
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-transparent to-transparent opacity-90" />
            
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              {reviews >= 5 ? (
                <Badge className="bg-black/60 backdrop-blur-xl text-white border-white/10 gap-1.5 h-9 px-3 shadow-xl">
                  <Star className="h-3.5 w-3.5 fill-[#FFB800] text-[#FFB800]" />
                  <span className="text-[11px] font-black">{Number(shop.rating).toFixed(1)}</span>
                </Badge>
              ) : (
                <Badge className="bg-primary/20 backdrop-blur-xl text-primary border-primary/20 gap-1.5 h-9 px-3 shadow-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest">Novo</span>
                </Badge>
              )}

              <div onClick={(e) => e.stopPropagation()}>
                <FavoriteButton 
                  targetId={shop.id} 
                  type="shop" 
                  isFavorite={isFavorite} 
                />
              </div>
            </div>
          </div>
        </AspectRatio>
      </div>

      <CardContent className="p-6 flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-4 min-w-0">
          <div className="min-w-0">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors truncate">
              {shop.name}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-widest truncate">{shop.neighborhood}</span>
            </div>
          </div>

          {Array.isArray(shop.categories) && shop.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 min-w-0">
              {shop.categories.slice(0, 3).map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  title={cat} 
                  className={cn(
                    "bg-white/5 backdrop-blur-md border-white/15 max-w-full",
                    "text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 text-white",
                  )}
                >
                  <span className="truncate block max-w-[140px]">{cat}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* 🚀 TIER-1 UI/UX: Correção Cirúrgica do Alinhamento e do Corte de Fonte */}
        <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between shrink-0">
          <div className="flex flex-col min-w-0">
            {shop.startingPrice > 0 && (
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 leading-none mb-1 block">
                A partir de
              </span>
            )}
            
            {/* 🧮 DESIGN LAPIDADO: Adicionado leading-normal, py-0.5 e px-0.5 para dar a margem segura de renderização que o itálico necessita */}
            <span className="text-base font-black text-primary italic uppercase tracking-tight leading-normal py-0.5 px-0.5 block truncate">
              {shop.startingPrice > 0 
                ? `R$ ${Number(shop.startingPrice).toFixed(2).replace(".", ",")}` 
                : 'Consulte'}
            </span>
          </div>
          
          <div className="shrink-0 h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
             <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}