import { cn } from "@/lib/utils";
import { Clock, Check, Tag } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: string;
  priceDisplay: string;
  promoText: string | null;
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  return (
    <button
      onClick={() => onSelect(service.id)}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
        isSelected 
          ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" 
          : "bg-card border-border hover:border-primary/50 hover:bg-secondary/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className={cn("font-black tracking-tight uppercase italic", isSelected ? "text-primary" : "text-foreground")}>
            {service.name}
          </h3>
          
          <div className="flex flex-col gap-2 mt-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5" /> {service.duration}
            </span>

            {/* SELO DE PROMOÇÃO TRINKS STYLE */}
            {service.promoText && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest w-fit">
                <Tag className="w-3 h-3" /> {service.promoText}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <span className={cn(
            "text-lg font-black tracking-tighter",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {service.priceDisplay}
          </span>
          
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
          )}>
            {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
          </div>
        </div>
      </div>
    </button>
  );
}