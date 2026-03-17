"use client"

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, Scissors, MapPin, Inbox } from "lucide-react";

export default function MyAppointments() {
  const { currentUser } = useAuth();

  // 📡 Busca Real: Puxando dados da tabela 'appointments'
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          barbearias ( name, neighborhood )
        `)
        .eq("user_id", currentUser?.id) // Verifique se na sua tabela é 'user_id' ou 'cliente_id'
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  return (
    <div className="container py-10 max-w-4xl animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Minha Agenda</h1>
        <p className="text-muted-foreground">Aqui você vê todos os seus serviços marcados.</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 bg-card animate-pulse rounded-2xl border border-border" />
          <div className="h-24 bg-card animate-pulse rounded-2xl border border-border" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-[2rem] border-2 border-dashed border-border">
          <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">Você ainda não agendou nada.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt: any) => (
            <div key={apt.id} className="bg-card border border-border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Scissors className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{apt.barbearias?.name || "Barbearia"}</h3>
                  <p className="text-sm text-muted-foreground">{apt.service_name || "Serviço"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex flex-col text-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Data e Hora</span>
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-primary" /> {apt.date}
                    <Clock className="h-4 w-4 text-primary" /> {apt.time}
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">
                  {apt.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}