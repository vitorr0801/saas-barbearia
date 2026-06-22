"use client"

import React, { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { ShopCard } from "@/components/discovery/ShopCard";
import { Heart, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/** * 🛠️ ESTRUTURA UNIFICADA (MOCK_SHOPS)
 * Mantida para consistência com o ClientPortal
 */
const MOCK_SHOPS = [
  { 
    id: "mock-1", 
    name: "Barbearia Vintage", 
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=60", 
    rating: 4.9, 
    neighborhood: "Asa Norte", 
    startingPrice: 45,
    categories: ["cabelo", "barba"] 
  },
  { 
    id: "mock-2", 
    name: "Corte & Estilo", 
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=60", 
    rating: 4.7, 
    neighborhood: "Sudoeste", 
    startingPrice: 55,
    categories: ["cabelo"] 
  },
  { 
    id: "mock-3", 
    name: "The Gentleman Barber", 
    image: "https://images.unsplash.com/photo-1621605815841-aa33c56b0201?w=800&auto=format&fit=crop&q=60", 
    rating: 4.8, 
    neighborhood: "Lago Sul", 
    startingPrice: 70,
    categories: ["barba", "toalha quente"] 
  }
];

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // 📡 1. BUSCA DOS IDS FAVORITADOS
  // 🚀 AJUSTE DE PRECISÃO: Voltamos para "user-favorite-ids" para bater com o ClientPortal e o Botão.
  const { data: favoriteIds = [], isLoading: loadingIds, refetch } = useQuery({
    queryKey: ["user-favorite-ids", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("target_id")
        .eq("user_id", currentUser.id)
        .eq("type", "shop");
      
      if (error) throw error;
      return data?.map(f => f.target_id) || [];
    },
    // Sincroniza com o estado global de autenticação
    enabled: !authLoading && !!currentUser?.id && isAuthenticated,
    staleTime: 0, 
  });

  // 📡 2. BUSCA DAS BARBEARIAS REAIS
  const { data: realShops = [], isLoading: loadingShops } = useQuery({
    queryKey: ["featured-shops-real"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbearias")
        .select("id, name, neighborhood, categories, cover_image, status")
        .eq("status", "active");
      if (error) throw error;
      return (
        (data ?? []).map((s: { id: string; name: string; neighborhood: string | null; categories: string[] | null; cover_image: string | null; status: string | null }) => ({
          id: s.id,
          name: s.name,
          neighborhood: s.neighborhood ?? "—",
          categories: Array.isArray(s.categories) ? s.categories : [],
          coverImage: s.cover_image ?? null,
          rating: 4.8,
          startingPrice: 55,
        })) ?? []
      );
    },
    staleTime: 1000 * 60 * 5,
  });

  // 🔄 SINCRONIZAÇÃO DE ENTRADA: Garante que os dados estejam frescos ao abrir a página
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      refetch();
    }
  }, [isAuthenticated, currentUser?.id, refetch]);

  // 🧬 FUSÃO E FILTRAGEM (Real-Time UI)
  const favoriteShops = useMemo(() => {
    const safeIds = Array.isArray(favoriteIds) ? favoriteIds : [];
    const allAvailable = [...realShops, ...MOCK_SHOPS];
    
    // O React re-filtra isso automaticamente quando o favoriteIds muda (via invalidateQueries)
    return allAvailable.filter(shop => safeIds.includes(shop.id));
  }, [realShops, favoriteIds]);

  const isLoading = loadingIds || loadingShops || authLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 py-8">
        
        {/* Cabeçalho de Navegação */}
        <div className="flex items-center gap-4 mb-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/descobrir")}
            className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-foreground leading-none">
              Meus <span className="text-primary">Favoritos</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">
              Gerencie suas escolhas de elite
            </p>
          </div>
        </div>

        {/* Grid de Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-card/50 animate-pulse rounded-[2.5rem] border border-white/5" />
            ))}
          </div>
        ) : favoriteShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {favoriteShops.map((shop) => (
              <ShopCard 
                key={shop.id} 
                shop={shop} 
                // 🎯 ESTADO REAL: Passamos true baseado na busca atual do banco
                isFavorite={favoriteIds.includes(shop.id)} 
                onSelect={(id) => navigate(`/agendar?shop=${id}`)} 
              />
            ))}
          </div>
        ) : (
          /* Estado Vazio (Zero Data UX) */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in zoom-in duration-500">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-primary/20" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-background rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
              </div>
            </div>
            
            <div className="max-w-sm space-y-3">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Sua coleção está vazia</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você ainda não favoritou nenhum lugar. Explore o portal para encontrar seu próximo estilo.
              </p>
            </div>

            <Button 
              onClick={() => navigate("/descobrir")}
              className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase italic text-[11px] rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <Search className="w-4 h-4 mr-2" /> Explorar Barbearias
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}