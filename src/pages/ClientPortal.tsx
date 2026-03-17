"use client"

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// 🚀 PADRÃO MUNDIAL: Importação Absoluta (Alias)
// Se o erro de "module not found" persistir, o problema é o cache do Vite, não o código.
import { Header } from "@/components/Header";

// Componentes da UI
import { SearchHub } from "@/components/discovery/SearchHub";
import { ActiveAppointmentCard } from "@/components/discovery/ActiveAppointmentCard";
import { CategoryNav } from "@/components/discovery/CategoryNav";
import { FeaturedShops } from "@/components/discovery/FeaturedShops";

export default function ClientPortal() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /**
   * 📡 BUSCA REAL DE AGENDAMENTOS (O "Jeito Certo")
   * Em vez de um objeto fake, buscamos o dado real. 
   * Se vier vazio, o array será [].
   */
  const { data: activeAppointments = [] } = useQuery({
    queryKey: ["active-appointments", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("status", "confirmado")
        .limit(1); // Pegamos apenas o mais próximo

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["featured-shops"],
    queryFn: async () => {
      const { data, error } = await supabase.from("barbearias").select("*").eq("status", "active");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, 
  });

  // Lógica de filtragem memoizada
  const filteredShops = useMemo(() => {
    return shops.filter((shop: any) => {
      const matchesSearch = searchQuery === "" || shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || shop.categories?.some((cat: string) => cat.toLowerCase() === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [shops, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container pt-24 py-8 space-y-10">
        <section className="px-1 animate-in fade-in duration-700">
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Olá, {currentUser?.name?.split(" ")[0] || "Cliente"}!
          </h2>
        </section>

        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <SearchHub searchQuery={searchQuery} onSearchChange={setSearchQuery} onUseLocation={() => {}} />
        </section>

        {/* 📅 PADRÃO TOP MUNDIAL: Renderização Condicional
            Só mostramos o card se existir um agendamento real.
            Isso elimina a necessidade de objetos "mock" (fakes).
        */}
        {activeAppointments.length > 0 && (
          <section className="animate-in fade-in duration-700 delay-100">
             <ActiveAppointmentCard appointment={activeAppointments[0]} />
          </section>
        )}

        <section className="animate-in fade-in duration-700 delay-200">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
            Categorias
          </h3>
          <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        </section>

        <section className="animate-in fade-in duration-700 delay-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Barbearias em Destaque</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card animate-pulse rounded-[2rem]" />)}
            </div>
          ) : (
            <FeaturedShops shops={filteredShops} onSelectShop={(id) => navigate(`/agendar?shop=${id}`)} />
          )}
        </section>
      </div>
    </div>
  );
}