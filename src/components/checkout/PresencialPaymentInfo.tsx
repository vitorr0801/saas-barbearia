import { CheckCircle2, CreditCard, QrCode, Banknote } from "lucide-react";

export function PresencialPaymentInfo() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Tudo certo!
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Seu horário ficará reservado. Pague diretamente no balcão após o serviço.
        </p>
        
        <div className="w-full p-4 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-3">
            Formas de pagamento aceitas presencialmente:
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Pix</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Cartão</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Banknote className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Dinheiro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
