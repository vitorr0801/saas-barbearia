// src/hooks/useProducts.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
}

export function useProducts() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ["products", currentUser?.barbearia_id],
    queryFn: async () => {
      if (!currentUser?.barbearia_id) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barbearia_id", currentUser.barbearia_id)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentUser?.barbearia_id,
    // Opcional, mas recomendado: Define que os dados são "frescos" por 1 minuto.
    // Evita requisições desnecessárias se o usuário ficar navegando rápido entre abas.
    staleTime: 1000 * 60, 
  });
}