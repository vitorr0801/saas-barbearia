"use client"

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookingSummaryCard } from "@/components/checkout/BookingSummaryCard";
import { PaymentMethodSelector, PaymentMethod } from "@/components/checkout/PaymentMethodSelector";
import { OnlinePaymentForm } from "@/components/checkout/OnlinePaymentForm";
import { PresencialPaymentInfo } from "@/components/checkout/PresencialPaymentInfo";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");

  // 📦 Capturando os detalhes vindos do Index.tsx
  const bookingDetails = location.state || {
    serviceName: "Corte + Barba",
    professionalName: "Diego",
    date: "Hoje",
    time: "14:30",
    totalPrice: "R$ 80,00",
    appointmentDate: new Date().toISOString(), // Fallback de segurança
  };

  const handleConfirm = async () => {
    // 1. TRAVA DE SEGURANÇA
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Usuário não identificado ⚠️",
        description: "Faça login novamente para continuar.",
      });
      return;
    }

    // 2. Limpeza do preço (Ex: "R$ 80,00" -> 80.00)
    const numericPrice = typeof bookingDetails.totalPrice === 'string' 
      ? parseFloat(bookingDetails.totalPrice.replace(/[^\d,]/g, "").replace(",", "."))
      : bookingDetails.totalPrice;

    toast({
      title: "Processando...",
      description: "Reservando seu horário de elite.",
    });

    try {
      // 🚀 A MANOBRA FINAL: Inserção com a data correta
      const { error } = await supabase.from("appointments").insert([
        {
          client_id: currentUser.id,
          client_name_static: currentUser.name || "Cliente",
          client_phone_static: currentUser.phone || "Não informado",
          
          service_name: bookingDetails.serviceName,
          professional_name: bookingDetails.professionalName,
          price: numericPrice,
          
          // 🔥 CORREÇÃO AQUI: Usamos a data que veio do calendário (Index.tsx)
          // Em vez de 'new Date()', usamos o 'appointmentDate' que fundimos antes.
          appointment_date: bookingDetails.appointmentDate, 
          
          status: "pending",
          payment_method: paymentMethod, 
        },
      ]);

      if (error) throw error;

      // 5. Sucesso Total!
      toast({
        title: paymentMethod === "online" ? "Pagamento Realizado! ✅" : "Agendamento Confirmado! 📅",
        description: "Seu horário foi reservado com sucesso!",
      });

      // Redireciona para a página de agenda para o usuário ver o novo card
      navigate("/agendamentos");

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        variant: "destructive",
        title: "Erro no agendamento ❌",
        description: error.message || "Não foi possível salvar. Tente novamente.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground italic uppercase tracking-tighter">Finalizar</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confirme os detalhes</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Booking Summary */}
        <BookingSummaryCard
          serviceName={bookingDetails.serviceName}
          professionalName={bookingDetails.professionalName}
          date={bookingDetails.date}
          time={bookingDetails.time}
          totalPrice={bookingDetails.totalPrice}
        />

        {/* Payment Method Selector */}
        <PaymentMethodSelector
          selected={paymentMethod}
          onSelect={setPaymentMethod}
        />

        {/* Dynamic Content Area */}
        <div className="min-h-[280px] animate-in fade-in duration-500">
          {paymentMethod === "online" ? (
            <OnlinePaymentForm />
          ) : (
            <PresencialPaymentInfo />
          )}
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50">
        <Button
          onClick={handleConfirm}
          className="w-full h-14 btn-primary-glow text-lg font-black uppercase italic tracking-tight"
        >
          {paymentMethod === "online"
            ? `Pagar e Agendar (${bookingDetails.totalPrice})`
            : "Confirmar Agendamento"}
        </Button>
      </div>
    </div>
  );
}