"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Header } from "@/components/Header"
import { SearchHub } from "@/components/discovery/SearchHub"
import { ActiveAppointmentCard } from "@/components/discovery/ActiveAppointmentCard"
import { CategoryNav } from "@/components/discovery/CategoryNav"
import { FeaturedShops } from "@/components/discovery/FeaturedShops"
import { FavoriteSection } from "@/components/discovery/FavoriteSection"
import { Sparkles, ArrowRight, ShieldAlert } from "lucide-react"

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

  // 📡 1. BUSCA DE BARBEARIAS (Sempre ativa para Guest Mode)
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

  // 📡 2. BUSCA DE FAVORITOS (Inativa para Guest)
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
    enabled: !authLoading && isAuthenticated && !!currentUser?.id,
  });

  // 📡 3. BUSCA DE AGENDAMENTOS (Inativa para Guest)
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
    enabled: !authLoading && isAuthenticated && !!currentUser?.id,
  });

  // 🔄 SINCRONIZAÇÃO DE SEGURANÇA
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser?.id) {
      refetchFavorites();
    }
  }, [authLoading, isAuthenticated, currentUser?.id, refetchFavorites]);

  // 🛡️ INTERCEPTADOR DE AÇÕES (UX de Elite)
  const handleProtectedAction = (shopId: string) => {
    if (!isAuthenticated) {
      toast.info("Acesso Restrito", {
        icon: <ShieldAlert className="w-5 h-5 text-primary" />,
        description: "Você precisa de uma conta BarberPro para realizar agendamentos e salvar favoritos.",
        action: {
          label: "Criar Conta Grátis",
          onClick: () => navigate("/cadastro?role=cliente&mode=signup")
        },
      });
      return;
    }
    navigate(`/agendar?shop=${shopId}`);
  };

  // 🧬 FUSÃO E FILTRAGEM
  const allShops = useMemo(() => [...realShops, ...MOCK_SHOPS], [realShops]);

  const favoriteShops = useMemo(() => {
    if (!isAuthenticated || !currentUser) return [];
    const safeIds = Array.isArray(favoriteIds) ? favoriteIds : [];
    return allShops.filter(shop => safeIds.includes(shop.id));
  }, [allShops, favoriteIds, currentUser, isAuthenticated]);

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
        
        {/* 1. SEÇÃO DE BOAS-VINDAS DINÂMICA */}
        <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none">
            {isAuthenticated && currentUser ? (
              <>Olá, <span className="text-primary">{currentUser.name?.split(" ")[0]}</span>!</>
            ) : (
              <>DESCUBRA O <span className="text-primary">MELHOR DA BARBEARIA.</span></>
            )}
          </h2>
          {!isAuthenticated && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-3 opacity-60">
              Explorando como convidado
            </p>
          )}
        </section>

        {/* 2. HUB DE BUSCA */}
        <section>
          <SearchHub searchQuery={searchQuery} onSearchChange={setSearchQuery} onUseLocation={() => {}} />
        </section>

        {/* 3. BANNER DE CONVERSÃO PARA CONVIDADOS */}
        {!isAuthenticated && !authLoading && (
          <section className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            <div className="relative z-10 max-w-md space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
                Experiência Elite
              </div>
              <h4 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Sua jornada começa aqui</h4>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                Junte-se a milhares de homens que gerenciam seu estilo com agilidade. Salve favoritos e agende em segundos.
              </p>
              <button 
                onClick={() => navigate("/cadastro?role=cliente&mode=signup")} 
                className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase italic text-[11px] rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                Criar Minha Conta Agora <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* 4. AGENDAMENTOS ATIVOS (Somente Logados) */}
        {isAuthenticated && activeAppointments.length > 0 && (
          <section className="animate-in fade-in duration-700">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               Próximo Agendamento
             </h3>
             <ActiveAppointmentCard appointment={activeAppointments[0]} />
          </section>
        )}

        {/* 5. FAVORITOS (Somente Logados) */}
        {isAuthenticated && favoriteShops.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FavoriteSection 
              favorites={favoriteShops} 
              favoriteIds={favoriteIds} 
              onSelectShop={handleProtectedAction} 
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
              favoriteIds={favoriteIds} 
              onSelectShop={handleProtectedAction} 
            />
          )}
        </section>
      </div>
    </div>
  );
}