import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_DAY_KEYS, WORK_DAY_LABELS } from "@/constants/workHours";

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

function buildTimeOptions(): string[] {
  const startMinutes = 7 * 60; // 07:00
  const endMinutes = 22 * 60; // 22:00
  const options: string[] = [];
  for (let m = startMinutes; m <= endMinutes; m += 15) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    options.push(`${hh}:${mm}`);
  }
  return options;
}

const timeOptions = buildTimeOptions();

const defaultDay: DaySchedule = { enabled: false, start: "09:00", end: "19:00" };

export function BarberWorkHours({ isEditing, schedule, onChange }: BarberWorkHoursProps) {
  return (
    <div className="dash-card overflow-visible">
      <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        Horários de Trabalho
      </h2>
      <div className="space-y-3">
        {WORK_DAY_KEYS.map((key) => {
          const label = WORK_DAY_LABELS[key];
          const day = schedule[key] ?? defaultDay;
          const enabled = Boolean(day?.enabled);
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3",
                enabled ? "border-primary/25 bg-primary/5" : "border-border bg-secondary/20",
              )}
            >
              <Switch
                checked={enabled}
                disabled={!isEditing}
                onCheckedChange={(v) => onChange(key, "enabled", v)}
                className="data-[state=checked]:bg-primary"
              />
              <span
                className={cn(
                  "text-sm font-semibold w-28 shrink-0",
                  enabled ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              <div className="flex items-center gap-2 sm:ml-auto">
                <Select
                  value={day.start}
                  disabled={!isEditing || !enabled}
                  onValueChange={(v) => onChange(key, "start", v)}
                >
                  <SelectTrigger size="sm" className="w-[96px] rounded-xl bg-secondary/50 border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-[280px] overflow-y-auto">
                    {timeOptions.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  até
                </span>
                <Select
                  value={day.end}
                  disabled={!isEditing || !enabled}
                  onValueChange={(v) => onChange(key, "end", v)}
                >
                  <SelectTrigger size="sm" className="w-[96px] rounded-xl bg-secondary/50 border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-[280px] overflow-y-auto">
                    {timeOptions.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
