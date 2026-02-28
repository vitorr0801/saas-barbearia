import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  avatar?: string;
  specialty?: string;
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
      className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
    >
      <div className="relative">
        <Avatar className={cn(
          "h-16 w-16 ring-2 ring-offset-2 ring-offset-background transition-all",
          isSelected ? "ring-primary" : "ring-transparent"
        )}>
          <AvatarImage src={professional.avatar} />
          <AvatarFallback className="bg-secondary text-foreground text-lg">
            {professional.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center glow-amber-subtle">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className={cn(
          "font-medium text-sm",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          {professional.name}
        </p>
        {professional.specialty && (
          <p className="text-xs text-muted-foreground">{professional.specialty}</p>
        )}
      </div>
    </button>
  );
}
