"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookingSummaryCard } from "@/components/checkout/BookingSummaryCard";
import { PaymentMethodSelector, PaymentMethod } from "@/components/checkout/PaymentMethodSelector";
import { OnlinePaymentForm } from "@/components/checkout/OnlinePaymentForm";
import { PresencialPaymentInfo } from "@/components/checkout/PresencialPaymentInfo";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { BookingAuthRequiredDialog } from "@/components/booking/BookingAuthRequiredDialog";
import { isBookingCheckoutState, type BookingCheckoutState } from "@/types/booking";

/** Valores gravados em `appointments.payment_method`: online (gateway) ou local (balcão). */
function appointmentPaymentMethod(method: PaymentMethod): "online" | "local" {
  return method === "presencial" ? "local" : "online";
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentUser, role, isAuthenticated, isLoading: authLoading } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawState = location.state as unknown;
  const booking: BookingCheckoutState | null = isBookingCheckoutState(rawState) ? rawState : null;

  const verifySession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setAuthDialogOpen(true);
    }
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    void verifySession();
  }, [verifySession]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && role === "barbeiro") {
      toast({
        variant: "destructive",
        title: "Fluxo exclusivo para clientes",
        description: "Use o painel da barbearia para gerenciar sua operação.",
      });
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  const handleConfirm = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setAuthDialogOpen(true);
      return;
    }

    if (role !== "cliente" || !currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Conta de cliente necessária",
        description: "Faça login com uma conta de cliente para concluir o agendamento.",
      });
      return;
    }

    if (!booking) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Volte ao agendamento e selecione serviço, profissional e horário.",
      });
      return;
    }

    const appointmentDateIso = booking.appointmentDate;
    if (!appointmentDateIso || Number.isNaN(Date.parse(appointmentDateIso))) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "Refaça a seleção de data e horário.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("appointments").insert({
        barbearia_id: booking.shopId,
        professional_id: booking.professionalId,
        service_id: booking.serviceId,
        client_id: currentUser.id,
        appointment_date: appointmentDateIso,
        status: "pendente",
        total_price: booking.servicePrice,
        service_name: booking.serviceName,
        payment_method: appointmentPaymentMethod(paymentMethod),
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["booked-slots"] });

      toast({
        title: "Agendamento registrado",
        description: "Seu horário foi reservado com sucesso.",
      });

      navigate("/sucesso", { replace: true });
    } catch (error: any) {
      console.error("Erro ao salvar:", error?.message || error);
      const message = error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.";
      toast({
        variant: "destructive",
        title: "Erro no agendamento",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showMissingData = sessionChecked && !booking;
  /** Resumo visível para cliente ou visitante com estado válido (barbeiro já foi redirecionado). */
  const showSummaryCard = !!booking && sessionChecked && role !== "barbeiro";

  return (
    <div className="min-h-screen bg-background pb-28">
      <BookingAuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground italic uppercase tracking-tighter">Finalizar</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confirme os detalhes</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {!sessionChecked && (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>
        )}

        {sessionChecked && showMissingData && (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-8 text-center space-y-4">
            <p className="text-sm font-semibold text-foreground">Nenhum agendamento em andamento</p>
            <p className="text-xs text-muted-foreground">Escolha uma barbearia e monte seu horário para continuar.</p>
            <Button className="rounded-xl btn-primary-glow" onClick={() => navigate("/descobrir")}>
              Descobrir barbearias
            </Button>
          </div>
        )}

        {showSummaryCard && booking && (
          <>
            <BookingSummaryCard
              serviceName={booking.serviceName}
              professionalName={booking.professionalName}
              date={booking.dateLabel}
              time={booking.time}
              totalPrice={booking.totalPriceDisplay}
            />

            <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

            <div className="min-h-[280px] animate-in fade-in duration-500">
              {paymentMethod === "online" ? <OnlinePaymentForm /> : <PresencialPaymentInfo />}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50">
        <Button
          onClick={handleConfirm}
          disabled={!booking || isSubmitting || role === "barbeiro"}
          className="w-full h-14 btn-primary-glow text-lg font-black uppercase italic tracking-tight disabled:opacity-30"
        >
          {isSubmitting ? (
            "Processando…"
          ) : paymentMethod === "online" && booking ? (
            `Pagar e Agendar (${booking.totalPriceDisplay})`
          ) : (
            "Confirmar Agendamento"
          )}
        </Button>
      </div>
    </div>
  );
}
