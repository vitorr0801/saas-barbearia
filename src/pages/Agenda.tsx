"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Calendar as CalendarIcon } from "lucide-react";
// 🗑️ IMPORT APAGADO: import { AppLayout } from "@/components/layout/AppLayout";
import { AgendaDayView } from "@/components/agenda/AgendaDayView";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { startOfMonth, endOfMonth } from "date-fns";

export default function Agenda() {
  const { currentUser } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // 🛡️ IDENTIFICAÇÃO E PERMISSÕES DE ISOLAMENTO (RBAC)
  const isOwner = Boolean(currentUser?.is_admin);
  const userJob = (currentUser?.job_title || "barbeiro").toLowerCase().trim();
  const barbeariaId = currentUser?.barbearia_id;
  const userId = currentUser?.id;

  // Gerentes e Secretárias podem ver todos os agendamentos da loja
  const canSeeAllAgendas = isOwner || userJob === "gerente" || userJob === "secretária" || userJob === "secretaria";

  // 🚀 BUSCA MENSAL ISOLADA
  const { data: bookedDays = [] } = useQuery({
    // Chave de cache inclui 'canSeeAllAgendas' para evitar conflito de tela
    queryKey: ["booked-days-month", barbeariaId, userId, canSeeAllAgendas, startOfMonth(selectedDay)],
    queryFn: async () => {
      if (!barbeariaId || !userId) return [];
      
      let q = supabase
        .from("appointments")
        .select("appointment_date")
        .eq("barbearia_id", barbeariaId)
        .gte("appointment_date", startOfMonth(selectedDay).toISOString())
        .lte("appointment_date", endOfMonth(selectedDay).toISOString())
        .not("status", "eq", "cancelled");

      // Se NÃO tiver superpoder, vê apenas as suas próprias "bolinhas"
      if (!canSeeAllAgendas) {
        q = q.eq("professional_id", userId);
      }

      const { data, error } = await q;
      if (error) throw error;

      return data?.map(a => new Date(a.appointment_date)) || [];
    },
    enabled: !!barbeariaId && !!userId,
  });

  return (
    // 🚀 TAG <AppLayout> REMOVIDA DAQUI
    <div className="container w-full max-w-7xl mx-auto space-y-8">
      
      <header className="flex items-center gap-4 animate-in fade-in duration-500">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner shadow-primary/5">
          <CalendarIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">
            Gestão de Agenda
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {canSeeAllAgendas ? "Ocupação mensal da barbearia" : "Sua ocupação mensal"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[350px_1fr] gap-8 items-start">
        <aside className="animate-in fade-in slide-in-from-left-4 duration-700">
          <Card className="p-4 border-border/40 bg-card/30 backdrop-blur-xl rounded-[2rem] shadow-2xl">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={(date) => date && setSelectedDay(date)}
              className="rounded-2xl"
              modifiers={{ booked: bookedDays }}
              modifiersClassNames={{ 
                booked: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full" 
              }}
            />
          </Card>
        </aside>

        <main className="animate-in fade-in slide-in-from-right-4 duration-700">
          <AgendaDayView 
            selectedDay={selectedDay} 
            onSelectedDayChange={setSelectedDay}
          />
        </main>
      </div>
    </div>
  );
}