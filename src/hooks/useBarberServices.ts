import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type BarberServiceData = {
  service_id: string;
  name: string;
  master_price: number;
  master_duration: number;
  is_active: boolean;
  custom_price: number | null;
  custom_duration: number | null;
};

export function useBarberServices(barbeariaId?: string, barberId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["barber-services", barbeariaId, barberId],
    queryFn: async (): Promise<BarberServiceData[]> => {
      if (!barbeariaId || !barberId) return [];

      // 1. Busca os serviços Master da Barbearia
      const { data: masterServices, error: masterErr } = await supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("barbearia_id", barbeariaId)
        .order("name");
        
      if (masterErr) throw masterErr;

      // 2. Busca as exceções/configurações do Barbeiro específico
      const { data: overrides, error: overridesErr } = await supabase
        .from("barber_services")
        .select("service_id, is_active, price, duration_minutes")
        .eq("barber_id", barberId);
        
      if (overridesErr) throw overridesErr;

      // 3. Faz o Merge (Cruzamento de dados)
      return (masterServices || []).map(master => {
        const override = (overrides || []).find(o => o.service_id === master.id);
        return {
          service_id: master.id,
          name: master.name,
          master_price: Number(master.price),
          master_duration: master.duration_min,
          // Se não existir na tabela pivô, por padrão o serviço vem DESATIVADO para novos membros
          is_active: override ? override.is_active : false, 
          custom_price: override?.price ? Number(override.price) : null,
          custom_duration: override?.duration_minutes ?? null,
        };
      });
    },
    enabled: !!barbeariaId && !!barberId,
  });

  const updateServices = useMutation({
    mutationFn: async (payload: { barberId: string; services: BarberServiceData[] }) => {
      // Prepara os dados para o UPSERT (Atualiza se existir, insere se não existir)
      const upsertData = payload.services.map(s => ({
        barber_id: payload.barberId,
        service_id: s.service_id,
        is_active: s.is_active,
        price: s.custom_price || null,
        duration_minutes: s.custom_duration || null,
      }));

      const { error } = await supabase
        .from("barber_services")
        .upsert(upsertData, { onConflict: "barber_id, service_id" });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barber-services", barbeariaId, barberId] });
    }
  });

  return { ...query, updateServices };
}