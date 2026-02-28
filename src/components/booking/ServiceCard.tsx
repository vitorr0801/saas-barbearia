import { cn } from "@/lib/utils";
import { Clock, Check } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
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
        "service-card w-full text-left",
        isSelected && "service-card-selected"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{service.name}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {service.duration}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-lg font-bold",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {service.price}
          </span>
          
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            isSelected 
              ? "border-primary bg-primary" 
              : "border-muted-foreground"
          )}>
            {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
          </div>
        </div>
      </div>
    </button>
  );
}
