import { useState } from "react";
import { X, User, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; whatsapp: string; cpf: string }) => void;
  bookingDetails: {
    service: string;
    professional: string;
    date: string;
    time: string;
    price: string;
  };
}

export function BookingConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  bookingDetails 
}: BookingConfirmModalProps) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ name, whatsapp, cpf });
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-t-2xl md:rounded-2xl animate-slide-up">
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Finalizar Agendamento</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Booking Summary */}
          <div className="p-4 rounded-xl bg-secondary/50 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-foreground">{bookingDetails.service}</p>
                <p className="text-sm text-muted-foreground">
                  com {bookingDetails.professional}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {bookingDetails.date} às {bookingDetails.time}
                </p>
              </div>
              <p className="text-lg font-bold text-primary">{bookingDetails.price}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Seu Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Como podemos te chamar?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-foreground">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  className="pl-10 bg-secondary border-border"
                  maxLength={15}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-foreground">
                CPF <span className="text-muted-foreground text-xs">(Para sua segurança)</span>
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  className="pl-10 bg-secondary border-border"
                  maxLength={14}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 btn-primary-glow text-lg font-semibold mt-6"
            >
              Finalizar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
