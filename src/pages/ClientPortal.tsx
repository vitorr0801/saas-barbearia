"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"

import { Header } from "@/components/Header"
import { SearchHub } from "@/components/discovery/SearchHub"
import { ActiveAppointmentCard } from "@/components/discovery/ActiveAppointmentCard"
import { CategoryNav } from "@/components/discovery/CategoryNav"
import { FeaturedShops } from "@/components/discovery/FeaturedShops"
import { FavoriteSection } from "@/components/discovery/FavoriteSection"
import { Sparkles, ArrowRight } from "lucide-react"

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
  }
];

export default function ClientPortal() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 📡 1. BUSCA DE BARBEARIAS
  const { data: realShops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ["featured-shops-real"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbearias")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, 
  });

  // 📡 2. BUSCA DE FAVORITOS (Otimizada para persistência)
  const { data: favoriteIds = [], refetch: refetchFavorites } = useQuery({
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
    enabled: !authLoading && !!currentUser?.id,
    staleTime: 0, 
  });

  // 📡 3. BUSCA DE AGENDAMENTOS
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
    enabled: !authLoading && !!currentUser?.id,
  });

  // 🔄 SINCRONIZAÇÃO DE SEGURANÇA: Garante que o refresh não "esqueça" os dados
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser?.id) {
      refetchFavorites();
    }
  }, [authLoading, isAuthenticated, currentUser?.id, refetchFavorites]);

  // 🧬 FUSÃO DE DADOS
  const allShops = useMemo(() => [...realShops, ...MOCK_SHOPS], [realShops]);

  // ⭐ FILTRO DE FAVORITOS
  const favoriteShops = useMemo(() => {
    if (authLoading || !currentUser) return [];
    const safeIds = Array.isArray(favoriteIds) ? favoriteIds : [];
    return allShops.filter(shop => safeIds.includes(shop.id));
  }, [allShops, favoriteIds, authLoading, currentUser]);

  // 🔍 FILTRAGEM DE BUSCA
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
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 space-y-12">
        
        {/* 1. SEÇÃO DE BOAS-VINDAS */}
        <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none">
            {!authLoading && isAuthenticated && currentUser ? (
              <>Olá, <span className="text-primary">{currentUser.name?.split(" ")[0]}</span>!</>
            ) : (
              <>DOMINE SEU <span className="text-primary">ESTILO.</span></>
            )}
          </h2>
        </section>

        {/* 2. HUB DE BUSCA */}
        <section>
          <SearchHub searchQuery={searchQuery} onSearchChange={setSearchQuery} onUseLocation={() => {}} />
        </section>

        {/* 3. BANNER PARA VISITANTES */}
        {!authLoading && !isAuthenticated && (
          <section className="relative p-8 rounded-[2rem] bg-primary/5 border border-primary/10 overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-20 h-20 text-primary" />
            </div>
            <div className="relative z-10 max-w-md space-y-4">
              <h4 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Agende em segundos</h4>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">Crie sua conta para salvar favoritos e gerenciar agendamentos.</p>
              <button onClick={() => navigate("/cadastro")} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-4 transition-all">
                Começar Experiência Elite <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* 4. AGENDAMENTOS ATIVOS */}
        {!authLoading && activeAppointments.length > 0 && (
          <section className="animate-in fade-in duration-700">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               Próximo Agendamento
             </h3>
             <ActiveAppointmentCard appointment={activeAppointments[0]} />
          </section>
        )}

        {/* 5. FAVORITOS (Com o Pente Fino aplicado) */}
        {!authLoading && isAuthenticated && favoriteShops.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FavoriteSection 
              favorites={favoriteShops} 
              favoriteIds={favoriteIds} // 🎯 PASSANDO A VERDADE
              onSelectShop={(id) => navigate(`/agendar?shop=${id}`)} 
            />
          </div>
        )}

        {/* 6. CATEGORIAS */}
        <section>
          <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        </section>

        {/* 7. BARBEARIAS EM DESTAQUE */}
        <section className="animate-in fade-in duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
              Barbearias de <span className="text-primary">Elite</span>
            </h2>
          </div>
          
          {shopsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card/50 animate-pulse rounded-[2.5rem] border border-white/5" />)}
            </div>
          ) : (
            <FeaturedShops 
              shops={filteredShops} 
              favoriteIds={favoriteIds} // 🎯 PASSANDO A VERDADE
              onSelectShop={(id) => navigate(`/agendar?shop=${id}`)} 
            />
          )}
        </section>
      </div>
    </div>
  );
}