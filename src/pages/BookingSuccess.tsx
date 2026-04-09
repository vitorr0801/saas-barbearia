"use client";

import { useNavigate } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

export default function BookingSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 container flex flex-col items-center justify-center py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarCheck className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-black uppercase italic tracking-tight">Agendamento confirmado</h1>
          <p className="text-sm text-muted-foreground">
            Seu horário foi registrado. Você pode acompanhar em Minha Agenda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/descobrir")}>
            Descobrir barbearias
          </Button>
          <Button className="flex-1 rounded-xl btn-primary-glow" onClick={() => navigate("/meus-agendamentos")}>
            Minha agenda
          </Button>
        </div>
      </div>
    </div>
  );
}
