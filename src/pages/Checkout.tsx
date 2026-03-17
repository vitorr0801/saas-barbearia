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

  // Get booking details from navigation state or use defaults
  const bookingDetails = location.state || {
    serviceName: "Corte + Barba",
    professionalName: "Diego",
    date: "Hoje",
    time: "14:30",
    totalPrice: "R$ 80,00",
  };

  const handleConfirm = async () => {
    // 1. TRAVA DE SEGURANÇA: Só tenta salvar se o ID do usuário estiver pronto
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Usuário não identificado ⚠️",
        description: "Faça logout e login novamente para atualizar sua sessão.",
      });
      return;
    }

    // 2. Limpeza do preço (Ex: "R$ 80,00" -> 80.00)
    const numericPrice = parseFloat(
      bookingDetails.totalPrice.replace(/[^\d,]/g, "").replace(",", ".")
    );

    // 3. Feedback visual
    toast({
      title: "Confirmando...",
      description: "Salvando seu horário na nuvem.",
    });

    try {
      // 4. Inserção no Supabase (Usando apenas 'currentUser')
      const { error } = await supabase.from("appointments").insert([
        {
          client_id: currentUser.id, // ID vindo do AuthContext
          
          // SNAPSHOT: Gravando os dados atuais para o histórico do barbeiro
          client_name_static: currentUser.name || "Cliente",
          client_phone_static: currentUser.phone || "Não informado",
          
          service_name: bookingDetails.serviceName,
          professional_name: bookingDetails.professionalName,
          price: numericPrice,
          
          appointment_date: new Date().toISOString(), 
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

      navigate("/");

    } catch (error: any) {
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
              <h1 className="text-lg font-bold text-foreground">Pagamento</h1>
              <p className="text-xs text-muted-foreground">Finalize sua reserva</p>
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
        <div className="min-h-[280px]">
          {paymentMethod === "online" ? (
            <OnlinePaymentForm />
          ) : (
            <PresencialPaymentInfo />
          )}
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleConfirm}
          className="w-full h-14 btn-primary-glow text-lg font-semibold"
        >
          {paymentMethod === "online"
            ? `Finalizar Pagamento (${bookingDetails.totalPrice})`
            : "Confirmar Agendamento"}
        </Button>
      </div>
    </div>
  );
}
