"use client"

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { ShopCard } from "@/components/discovery/ShopCard";
import { Heart, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// MOCKS: Ajustados para coverImage (padrão do seu ShopCard)
const MOCK_SHOPS = [
  { id: "mock-1", name: "Barbearia Vintage", coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=60", rating: 4.9, neighborhood: "Asa Norte", categories: ["cabelo"] },
  { id: "mock-2", name: "Corte & Estilo", coverImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=60", rating: 4.7, neighborhood: "Sudoeste", categories: ["cabelo"] },
  { id: "mock-3", name: "The Gentleman Barber", coverImage: "https://images.unsplash.com/photo-1621605815841-aa33c56b0201?w=800&auto=format&fit=crop&q=60", rating: 4.8, neighborhood: "Lago Sul", categories: ["barba"] }
];

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // 📡 1. BUSCA DOS IDS (Blindada)
  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["user-favorite-ids", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("target_id")
        .eq("user_id", currentUser.id)
        .eq("type", "shop");
      
      if (error) return [];
      return data?.map(f => f.target_id) || [];
    },
    enabled: !!currentUser?.id,
  });

  // 📡 2. BUSCA DAS BARBEARIAS REAIS
  const { data: realShops = [] } = useQuery({
    queryKey: ["featured-shops-real"],
    queryFn: async () => {
      const { data } = await supabase.from("barbearias").select("*").eq("status", "active");
      return data || [];
    },
  });

  // 🧬 FUSÃO E FILTRAGEM (Otimização de Elite)
  const favoriteShops = useMemo(() => {
    // 🛡️ PROTEÇÃO: Se favoriteIds não for uma lista válida, usamos array vazio
    const safeIds = Array.isArray(favoriteIds) ? favoriteIds : [];
    const allAvailable = [...realShops, ...MOCK_SHOPS];
    return allAvailable.filter(shop => safeIds.includes(shop.id));
  }, [realShops, favoriteIds]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container pt-24 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">
            Meus Favoritos
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-card animate-pulse rounded-[2rem] border border-border" />
            ))}
          </div>
        ) : favoriteShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {favoriteShops.map((shop) => (
              <ShopCard 
                key={shop.id} 
                shop={shop} 
                onSelect={(id) => navigate(`/agendar?shop=${id}`)} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <div className="max-w-xs space-y-2">
              <h2 className="text-xl font-bold">Sua lista está vazia</h2>
              <p className="text-sm text-muted-foreground">
                Favorite as melhores barbearias para encontrá-las rapidamente aqui.
              </p>
            </div>
            <Button 
              onClick={() => navigate("/descobrir")}
              className="rounded-xl font-bold gap-2 px-8"
            >
              <Search className="w-4 h-4" /> Explorar barbearias
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}