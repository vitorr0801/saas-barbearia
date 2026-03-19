"use client"

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

import { Header } from "@/components/Header";
import { SearchHub } from "@/components/discovery/SearchHub";
import { ActiveAppointmentCard } from "@/components/discovery/ActiveAppointmentCard";
import { CategoryNav } from "@/components/discovery/CategoryNav";
import { FeaturedShops } from "@/components/discovery/FeaturedShops";
import { FavoriteSection } from "@/components/discovery/FavoriteSection";

const MOCK_SHOPS = [
  {
    id: "mock-1",
    name: "Barbearia Vintage",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=60",
    rating: 4.9,
    neighborhood: "Asa Norte",
    startingPrice: 45,
    categories: ["cabelo", "barba"],
    status: "active"
  },
  {
    id: "mock-2",
    name: "Corte & Estilo",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=60",
    rating: 4.7,
    neighborhood: "Sudoeste",
    startingPrice: 55,
    categories: ["cabelo"],
    status: "active"
  },
  {
    id: "mock-3",
    name: "The Gentleman Barber",
    image: "https://images.unsplash.com/photo-1621605815841-aa33c56b0201?w=800&auto=format&fit=crop&q=60",
    rating: 4.8,
    neighborhood: "Lago Sul",
    startingPrice: 70,
    categories: ["barba", "toalha quente"],
    status: "active"
  }
];

export default function ClientPortal() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 📡 1. BUSCA DE BARBEARIAS GERAIS
  const { data: realShops = [], isLoading } = useQuery({
    queryKey: ["featured-shops-real"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbearias")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, 
  });

  // 📡 2. BUSCA DE AGENDAMENTOS
  const { data: activeAppointments = [] } = useQuery({
    queryKey: ["active-appointments", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("status", "confirmado")
        .limit(1);
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // 📡 3. BUSCA APENAS DOS IDS FAVORITADOS (Otimização Máxima)
  const { data: favoriteIds = [] } = useQuery({
    queryKey: ["user-favorite-ids", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("target_id")
        .eq("user_id", currentUser.id)
        .eq("type", "shop");
      
      if (error) throw error;
      return data.map(f => f.target_id);
    },
    enabled: !!currentUser?.id,
  });

  // 🧬 FUSÃO E FILTRAGEM
  const allShops = useMemo(() => {
    return [...realShops, ...MOCK_SHOPS];
  }, [realShops]);

  // ⭐ FILTRAGEM DOS FAVORITOS (Cruzando IDs do banco com a lista local)
  const favoriteShops = useMemo(() => {
  // 🛡️ BLINDAGEM: Se favoriteIds vier com erro (não for array), usamos lista vazia
  const safeIds = Array.isArray(favoriteIds) ? favoriteIds : [];
  return allShops.filter(shop => safeIds.includes(shop.id));
}, [allShops, favoriteIds]);

  const filteredShops = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allShops.filter((shop: any) => {
      const matchesSearch = query === "" || shop.name.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === null || 
        shop.categories?.some((cat: string) => cat.toLowerCase() === selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [allShops, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container pt-24 py-8 space-y-10">
        <section className="px-1 animate-in fade-in duration-700">
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic">
            Olá, {currentUser?.name?.split(" ")[0] || "Cliente"}!
          </h2>
        </section>

        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <SearchHub searchQuery={searchQuery} onSearchChange={setSearchQuery} onUseLocation={() => {}} />
        </section>

        {activeAppointments.length > 0 && (
          <section className="animate-in fade-in duration-700 delay-100">
             <ActiveAppointmentCard appointment={activeAppointments[0]} />
          </section>
        )}

        {/* AGORA VAI APARECER: Mesmo que seja um Mock! */}
        <FavoriteSection 
          favorites={favoriteShops} 
          onSelectShop={(id) => navigate(`/agendar?shop=${id}`)} 
        />

        <section className="animate-in fade-in duration-700 delay-200">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
            Categorias
          </h3>
          <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        </section>

        <section className="animate-in fade-in duration-700 delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold italic uppercase tracking-tighter text-foreground">
              Barbearias em Destaque
            </h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card animate-pulse rounded-[2rem] border border-border" />)}
            </div>
          ) : (
            <FeaturedShops shops={filteredShops} onSelectShop={(id) => navigate(`/agendar?shop=${id}`)} />
          )}
        </section>
      </div>
    </div>
  );
}