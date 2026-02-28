import { Zap, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "online" | "presencial";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">
        Como você deseja pagar?
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Online Payment Card */}
        <button
          onClick={() => onSelect("online")}
          className={cn(
            "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
            "bg-card hover:bg-secondary/50",
            selected === "online"
              ? "border-primary shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "border-border"
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3",
              selected === "online"
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Zap className="h-6 w-6" />
          </div>
          <span className="font-semibold text-foreground text-sm text-center">
            Pagar Agora
          </span>
          <span className="text-xs text-primary font-medium">(Online)</span>
          <p className="text-xs text-muted-foreground mt-2 text-center leading-tight">
            Mais rápido. Evite filas no caixa.
          </p>
          {selected === "online" && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
          )}
        </button>

        {/* Presencial Payment Card */}
        <button
          onClick={() => onSelect("presencial")}
          className={cn(
            "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
            "bg-card hover:bg-secondary/50",
            selected === "presencial"
              ? "border-primary shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "border-border"
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3",
              selected === "presencial"
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Store className="h-6 w-6" />
          </div>
          <span className="font-semibold text-foreground text-sm text-center">
            Pagar na Barbearia
          </span>
          <span className="text-xs text-muted-foreground font-medium">&nbsp;</span>
          <p className="text-xs text-muted-foreground mt-2 text-center leading-tight">
            Pague no balcão após o serviço.
          </p>
          {selected === "presencial" && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}

export type { PaymentMethod };
