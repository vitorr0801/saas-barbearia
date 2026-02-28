import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface BarberWorkHoursProps {
  isEditing: boolean;
  schedule: Record<string, DaySchedule>;
  onChange: (day: string, field: keyof DaySchedule, value: string | boolean) => void;
}

const dayLabels: Record<string, string> = {
  seg: "Segunda", ter: "Terça", qua: "Quarta",
  qui: "Quinta", sex: "Sexta", sab: "Sábado",
};

const hours = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, "0")}:00`;
});

export function BarberWorkHours({ isEditing, schedule, onChange }: BarberWorkHoursProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        Horários de Trabalho
      </h2>
      <div className="space-y-3">
        {Object.entries(dayLabels).map(([key, label]) => {
          const day = schedule[key];
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg bg-secondary/30 px-4 py-3">
              <Switch
                checked={day.enabled}
                disabled={!isEditing}
                onCheckedChange={(v) => onChange(key, "enabled", v)}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium w-20 ${day.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {day.enabled ? (
                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    value={day.start}
                    disabled={!isEditing}
                    onValueChange={(v) => onChange(key, "start", v)}
                  >
                    <SelectTrigger className="w-[90px] h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">até</span>
                  <Select
                    value={day.end}
                    disabled={!isEditing}
                    onValueChange={(v) => onChange(key, "end", v)}
                  >
                    <SelectTrigger className="w-[90px] h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground ml-auto">Folga</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
