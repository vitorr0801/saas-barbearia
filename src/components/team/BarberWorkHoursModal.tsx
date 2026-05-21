import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BarberWorkHours } from "@/components/profile/BarberWorkHours";
import { WORK_DAY_KEYS, type WorkDayKey } from "@/constants/workHours";

interface BarberWorkHoursModalProps {
  barberId: string | null;
  barberName: string;
  barbeariaId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultSchedule: Record<WorkDayKey, { enabled: boolean; start: string; end: string }> = {
  dom: { enabled: false, start: "09:00", end: "19:00" },
  seg: { enabled: true,  start: "09:00", end: "19:00" },
  ter: { enabled: true,  start: "09:00", end: "19:00" },
  qua: { enabled: true,  start: "09:00", end: "19:00" },
  qui: { enabled: true,  start: "09:00", end: "19:00" },
  sex: { enabled: true,  start: "09:00", end: "20:00" },
  sab: { enabled: true,  start: "08:00", end: "17:00" },
};

function normalizeTimeForSelect(value: unknown, fallback: string): string {
  if (value == null || value === "") return fallback;
  const s = String(value).trim();
  if (s.length >= 5) return s.slice(0, 5);
  return fallback;
}

function toPostgresTime(hhmm: string): string {
  const t = hhmm.trim();
  if (/^\d{2}:\d{2}$/.test(t))       return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return t;
}

function normalizeDayKey(raw: unknown): WorkDayKey | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const byNum: Record<number, WorkDayKey> = { 0: "dom", 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab", 7: "dom" };
    if (raw in byNum) return byNum[raw];
  }
  const s = String(raw).toLowerCase().trim();
  if (WORK_DAY_KEYS.includes(s as WorkDayKey)) return s as WorkDayKey;
  return null;
}

function buildScheduleFromDbRows(
  rows: Array<{ day: unknown; start_time: unknown; end_time: unknown }>
): typeof defaultSchedule {
  const base: Record<string, { enabled: boolean; start: string; end: string }> = {};
  for (const key of WORK_DAY_KEYS) {
    base[key] = { enabled: false, start: defaultSchedule[key].start, end: defaultSchedule[key].end };
  }
  for (const row of rows) {
    const dayKey = normalizeDayKey(row.day);
    if (!dayKey || !base[dayKey]) continue;
    const def = defaultSchedule[dayKey];
    base[dayKey] = {
      enabled: true,
      start: normalizeTimeForSelect(row.start_time, def.start),
      end:   normalizeTimeForSelect(row.end_time,   def.end),
    };
  }
  return base as typeof defaultSchedule;
}

export function BarberWorkHoursModal({ barberId, barberName, barbeariaId, open, onOpenChange }: BarberWorkHoursModalProps) {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);

  const fetchSchedule = useCallback(async () => {
    if (!barberId || !open) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("barber_work_hours")
        .select("day_of_week, start_time, end_time")
        // ✅ CORREÇÃO: coluna correta é professional_id, não barber_id
        .eq("professional_id", barberId);

      if (error) throw error;

      if (data && data.length > 0) {
        const rows = data.map(row => ({
          day:        row.day_of_week,
          start_time: row.start_time,
          end_time:   row.end_time,
        }));
        setSchedule(buildScheduleFromDbRows(rows));
      } else {
        setSchedule(defaultSchedule);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar horários.");
    } finally {
      setIsLoading(false);
    }
  }, [barberId, open]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleScheduleChange = (day: string, field: string, value: string | boolean) => {
    setSchedule(prev => {
      const key = day as WorkDayKey;
      const current = prev[key];
      if (!current) return prev;
      if (field === "enabled" && value === false) {
        const defaults = defaultSchedule[key];
        return { ...prev, [day]: { enabled: false, start: defaults.start, end: defaults.end } };
      }
      return { ...prev, [day]: { ...current, [field]: value } };
    });
  };

  const handleSave = async () => {
    if (!barberId) return;
    setIsSaving(true);
    const toastId = toast.loading(`Salvando horários de ${barberName}...`);
    try {
      // 1. Apaga a agenda antiga inteira
      const { error: deleteError } = await supabase
        .from("barber_work_hours")
        .delete()
        // ✅ CORREÇÃO: coluna correta é professional_id, não barber_id
        .eq("professional_id", barberId);

      if (deleteError) throw deleteError;

      const dayToInt: Record<string, number> = {
        dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
      };

      // 2. Prepara os novos dias ativos
      const activeHoursToInsert = WORK_DAY_KEYS
        .filter(day => schedule[day]?.enabled)
        .map(day => ({
          professional_id: barberId,
          barbearia_id:    barbeariaId,
          day_of_week:     dayToInt[day],
          start_time:      toPostgresTime(schedule[day].start),
          end_time:        toPostgresTime(schedule[day].end),
        }));

      // 3. Insere a nova agenda
      if (activeHoursToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("barber_work_hours")
          .insert(activeHoursToInsert);
        if (insertError) throw insertError;
      }

      toast.success("Horários atualizados com sucesso!", { id: toastId });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar horários.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-background border-border max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Jornada de {barberName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Defina os dias e horários em que este profissional atende na barbearia.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="-mx-4 sm:mx-0">
              <BarberWorkHours
                isEditing={true}
                schedule={schedule}
                onChange={handleScheduleChange}
              />
            </div>
          )}
        </div>

        <div className="p-6 pt-2 border-t border-border flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <Save className="h-4 w-4 mr-2" />
            }
            Salvar Jornada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}