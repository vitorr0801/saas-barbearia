import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  avatar?: string;
  specialty?: string;
  priceDisplay?: string; // NOVO: Preço dinâmico do barbeiro
}

interface ProfessionalCardProps {
  professional: Professional;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ProfessionalCard({ professional, isSelected, onSelect }: ProfessionalCardProps) {
  return (
    <button
      onClick={() => onSelect(professional.id)}
      className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border shrink-0 min-w-[120px]",
        isSelected ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="relative">
        <Avatar className={cn(
          "h-16 w-16 ring-2 ring-offset-2 ring-offset-background transition-all",
          isSelected ? "ring-primary" : "ring-transparent"
        )}>
          <AvatarImage src={professional.avatar} />
          <AvatarFallback className="bg-secondary text-foreground font-black text-lg">
            {professional.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center glow-amber-subtle">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      
      <div className="text-center space-y-1">
        <p className={cn("font-black text-sm uppercase tracking-tight", isSelected ? "text-primary" : "text-foreground")}>
          {professional.name}
        </p>
        {professional.priceDisplay && (
          <p className="text-[11px] font-black text-emerald-500 tracking-widest">{professional.priceDisplay}</p>
        )}
      </div>
    </button>
  );
}