import { Checkbox } from "@/components/ui/checkbox";
import { Scissors } from "lucide-react";
import { formatDuration } from "@/lib/formatDuration";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface BarberServicesProps {
  isEditing: boolean;
  allServices: Service[];
  activeIds: string[];
  onToggle: (id: string) => void;
}

export function BarberServices({ isEditing, allServices, activeIds, onToggle }: BarberServicesProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Scissors className="h-5 w-5 text-primary" />
        Serviços que Realizo
      </h2>
      <div className="space-y-2">
        {allServices.map((svc) => {
          const active = activeIds.includes(svc.id);
          return (
            <label
              key={svc.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all cursor-pointer ${
                active ? "bg-primary/5 border border-primary/20" : "bg-secondary/30 border border-transparent"
              } ${!isEditing && "pointer-events-none"}`}
            >
              <Checkbox
                checked={active}
                disabled={!isEditing}
                onCheckedChange={() => onToggle(svc.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{svc.name}</p>
                <p className="text-xs text-muted-foreground">{formatDuration(svc.duration)}</p>
              </div>
              <span className="text-sm font-semibold text-primary">
                R$ {svc.price.toFixed(2).replace(".", ",")}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
