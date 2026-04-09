"use client";

import { Calendar } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AgendaDayView } from "@/components/agenda/AgendaDayView";

export default function Agenda() {
  return (
    <AppLayout>
      <div className="container w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 md:gap-4">
            <Calendar className="h-7 w-7 md:h-9 md:w-9 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-foreground">
                Agenda da Barbearia
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Horários, clientes e status do dia
              </p>
            </div>
          </div>
        </div>

        <div className="animate-fade-in w-full" style={{ animationDelay: "80ms" }}>
          <AgendaDayView />
        </div>
      </div>
    </AppLayout>
  );
}
