import type { WorkDayKey } from "@/constants/workHours";

const JS_DAY_TO_KEY: WorkDayKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

/** Data no formato pt-BR (DD/MM/AAAA) → chave do dia em `barber_work_hours.day`. */
export function ptBrDateToDayKey(dateStr: string): WorkDayKey | null {
  const parts = dateStr.split("/").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [day, month, year] = parts;
  const d = new Date(year, month - 1, day);
  if (d.getDate() !== day || d.getMonth() !== month - 1) return null;
  return JS_DAY_TO_KEY[d.getDay()] ?? null;
}

/** Aceita `HH:MM` ou `HH:MM:SS` do Postgres. */
export function normalizeTimeHHMM(t: string | null | undefined): string | null {
  if (t == null || String(t).trim() === "") return null;
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Gera horários de início possíveis entre start e end, em passos de `durationMin` minutos.
 * O último slot precisa terminar em ou antes de `end_time`.
 */
export function generateSlotsFromShift(startTime: string, endTime: string, durationMin: number): string[] {
  const start = normalizeTimeHHMM(startTime);
  const end = normalizeTimeHHMM(endTime);
  if (!start || !end || durationMin <= 0) return [];
  let cur = timeToMinutes(start);
  const endM = timeToMinutes(end);
  const slots: string[] = [];
  while (cur + durationMin <= endM) {
    slots.push(minutesToTime(cur));
    cur += durationMin;
  }
  return slots;
}
