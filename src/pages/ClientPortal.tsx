"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { SearchHub } from "@/components/discovery/SearchHub"
import { ActiveAppointmentCard } from "@/components/discovery/ActiveAppointmentCard"
import { CategoryNav } from "@/components/discovery/CategoryNav"
import { FeaturedShops } from "@/components/discovery/FeaturedShops"
import { FavoriteSection } from "@/components/discovery/FavoriteSection"
import { Sparkles, ArrowRight, ShieldAlert, MapPin, XCircle, Search, RotateCcw } from "lucide-react"

// =======================================================
// 📐 CONTRATOS E TIPAGENS DE ELITE (TIER-1 TYPES)
// =======================================================

export type Shop = {
  id: string;
  name: string;
  neighborhood: string;
  categories: string[];
  coverImage?: string; 
  distance?: number;
  rating: number;
  reviewCount: number;
  startingPrice: number;
};

type LastAppointmentShortcut = {
  id: string;
  barbearia_id: string;
  service_id: string;
  professional_id: string;
  services: { name: string } | null;
  barbearias: { name: string } | null;
};

type DatabaseShopRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  categories: string[] | null;
  cover_image: string | null;
  distancia_metros?: number;
  rating: number | null;
  review_count: number | null;
  starting_price: number | null;
};

type FavoriteIdRow = {
  target_id: string;
};

const normalizeText = (text: string): string => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function ClientPortal() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const isSearching = searchQuery.trim().length > 0 || selectedCategory !== null;

  // 📡 1. BUSCA DE BARBEARIAS REAIS
  const { data: realShops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["featured-shops-real", userLocation],
    queryFn: async () => {
      if (userLocation) {
        const { data, error } = await supabase.rpc("get_nearby_barbershops", {
          client_lat: userLocation.lat,
          client_lng: userLocation.lng,
          radius_km: 7 
        });
        
        if (error) throw error;
        
        return (data as DatabaseShopRow[] ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          neighborhood: s.neighborhood ?? "—",
          categories: Array.isArray(s.categories) ? s.categories : [], 
          coverImage: s.cover_image ?? undefined,
          distance: s.distancia_metros,
          rating: s.rating ?? 0,
          reviewCount: s.review_count ?? 0,
          startingPrice: Number(s.starting_price) || 0,
        }));
      }
      
      const { data, error } = await supabase
        .from("barbearias")
        .select("id, name, neighborhood, categories, cover_image, status, rating, review_count, starting_price")
        .eq("status", "active");
        
      if (error) throw error;
      
      return (data as DatabaseShopRow[] ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        neighborhood: s.neighborhood ?? "—",
        categories: Array.isArray(s.categories) ? s.categories : [],
        coverImage: s.cover_image ?? undefined,
        rating: s.rating ?? 0,
        reviewCount: s.review_count ?? 0,
        startingPrice: Number(s.starting_price) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5, 
  });

  // 📡 2. BUSCA DE FAVORITOS
  const { data: favoriteIds = [], refetch: refetchFavorites } = useQuery<string[]>({
    queryKey: ["user-favorite-ids", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("target_id")
        .eq("user_id", currentUser.id)
        .eq("type", "shop");
      if (error) throw error;
      return (data as FavoriteIdRow[]).map((f) => f.target_id);
    },
    enabled: !authLoading && isAuthenticated && !!currentUser?.id,
  });

  // 📡 3. BUSCA DE AGENDAMENTOS ATIVOS
  const { data: activeAppointments = [] } = useQuery({
    queryKey: ["active-appointments", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", currentUser.id)
        .eq("status", "confirmado")
        .limit(1);
      return data || [];
    },
    enabled: !authLoading && isAuthenticated && !!currentUser?.id,
  });

  // 📡 4. ATALHO INTELIGENTE TIER-1
  const { data: lastAppointment = null } = useQuery<LastAppointmentShortcut | null>({
    queryKey: ["last-consumed-appointment", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          barbearia_id,
          service_id,
          professional_id,
          services (name),
          barbearias (name)
        `)
        .eq("client_id", currentUser.id)
        .order("appointment_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as LastAppointmentShortcut | null;
    },
    enabled: !authLoading && isAuthenticated && !!currentUser?.id,
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser?.id) {
      refetchFavorites();
    }
  }, [authLoading, isAuthenticated, currentUser?.id, refetchFavorites]);

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

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }

    const toastId = toast.loading("Acionando radar por satélite...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Radar ativo! Mostrando barbearias num raio de 7km.", { id: toastId });
      },
      (err) => {
        let msg = "Não foi possível acessar sua localização.";
        if (err.code === 1) msg = "Permissão de localização negada. Verifique seu navegador.";
        toast.error(msg, { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const allShops = useMemo<Shop[]>(() => {
    return realShops;
  }, [realShops]);

  const favoriteShops = useMemo<Shop[]>(() => {
    if (!isAuthenticated || !currentUser) return [];
    const safeIds = Array.isArray(favoriteIds) ? favoriteIds : [];
    return allShops.filter((shop) => safeIds.includes(shop.id));
  }, [allShops, favoriteIds, currentUser, isAuthenticated]);

  const filteredShops = useMemo<Shop[]>(() => {
    const query = normalizeText(searchQuery);
    
    return allShops.filter((shop) => {
      const shopName = shop.name ? normalizeText(shop.name) : "";
      const matchesName = shopName.includes(query);
      
      const matchesCategorySearch = Array.isArray(shop.categories) && 
        shop.categories.some((cat: string) => normalizeText(cat).includes(query));

      const matchesSearch = query === "" || matchesName || matchesCategorySearch;
      
      const matchesCategoryFilter = selectedCategory === null || 
        (Array.isArray(shop.categories) && shop.categories.some((cat: string) => 
          normalizeText(cat) === normalizeText(selectedCategory)
        ));
      
      return matchesSearch && matchesCategoryFilter;
    });
  }, [allShops, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Header hideSearch={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 space-y-10">
        
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

        {/* O COCKPIT DE BUSCA UNIFICADO */}
        <section className="space-y-6">
          <SearchHub 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
            onUseLocation={handleUseLocation} 
          />
          
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
             <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          </div>
          
          {userLocation && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest animate-in zoom-in-95 duration-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Radar de Proximidade Ativo (Raio 7km)
              <button 
                onClick={() => setUserLocation(null)}
                className="ml-2 hover:text-white transition-colors"
                title="Desativar Radar"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* CONDICIONAIS DE MODO FOCO */}
        {!isSearching && !isAuthenticated && !authLoading && (
          <section className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden group animate-in fade-in duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            <div className="relative z-10 max-w-md space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
                Experiência Elite
              </div>
              <h4 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Sua jornada começa aqui</h4>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                Junte-se a milhares de homens que gerenciam seu estilo com agilidade. Salve favoritos e agende in segundos.
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

        {/* 🚀 CARD DE ATALHO COMPACTO REESTILIZADO (PADRÃO MUNDIAL UX/UI) */}
        {!isSearching && isAuthenticated && lastAppointment && (
          <section className="animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="relative p-6 md:p-8 rounded-[2.5rem] bg-[#0a0c12]/40 backdrop-blur-md border border-white/5 bg-gradient-to-r from-primary/5 via-transparent to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary/30 transition-all duration-500 group overflow-hidden">
              
              {/* Brilho Sutil de Fundo ao passar o mouse */}
              <div className="absolute -inset-y-full -left-1/4 w-1/2 bg-gradient-to-r from-primary/10 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000 pointer-events-none" />

              <div className="space-y-2.5 relative z-10">
                <div className="flex items-center gap-2 text-primary">
                  <RotateCcw className="w-3.5 h-3.5 opacity-70 group-hover:rotate-[-45deg] transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                    Repetir Último Serviço
                  </span>
                </div>
                
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                  {lastAppointment.services?.name || "Serviço Anterior"}
                </h4>
                
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <span>Última visita:</span>
                  <span className="text-white bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide">
                    {lastAppointment.barbearias?.name || "Barbearia"}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate(`/agendar?shop=${lastAppointment.barbearia_id}`, {
                  state: {
                    preSelectServiceId: lastAppointment.service_id,
                    preSelectProfessionalId: lastAppointment.professional_id
                  }
                })}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic text-xs rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 self-start sm:self-auto relative z-10 shrink-0"
              >
                Repetir Serviço <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </section>
        )}

        {/* PRÓXIMO AGENDAMENTO E OUTRAS SEÇÕES */}
        {!isSearching && isAuthenticated && activeAppointments.length > 0 && (
          <section className="animate-in fade-in duration-700">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               Próximo Agendamento
             </h3>
             <ActiveAppointmentCard appointment={activeAppointments[0]} />
          </section>
        )}

        {!isSearching && isAuthenticated && favoriteShops.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FavoriteSection 
              favorites={favoriteShops.slice(0, 3)} 
              favoriteIds={favoriteIds} 
              onSelectShop={handleProtectedAction} 
            />
            {favoriteShops.length > 3 && (
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => navigate("/favoritos")}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  Ver todos os favoritos <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        <section className="animate-in fade-in duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground flex items-center gap-2">
              {isSearching ? (
                <><Search className="w-6 h-6 text-primary" /> Resultados da <span className="text-primary">Busca</span></>
              ) : userLocation ? (
                <><MapPin className="w-6 h-6 text-primary" /> Perto de <span className="text-primary">Você</span></>
              ) : (
                <>Barbearias de <span className="text-primary">Elite</span></>
              )}
            </h2>
          </div>
          
          {shopsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-card/50 animate-pulse rounded-[2.5rem] border border-white/5" />)}
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border/50 rounded-3xl bg-card/20 flex flex-col items-center justify-center gap-3">
               <XCircle className="w-8 h-8 text-muted-foreground/30" />
               <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Nenhum resultado encontrado.</p>
               <p className="text-xs text-muted-foreground/60">Tente buscar por outro nome ou serviço.</p>
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