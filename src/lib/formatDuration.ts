/** Formata minutos inteiros em texto legível (ex.: 45 min, 1h, 1h 30min). */
export function formatDuration(minutes: number): string {
  if (minutes == null || Number.isNaN(Number(minutes))) return "0 min";
  const m = Math.round(Number(minutes));
  if (!m) return "0 min";
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h > 0 && rest > 0) return `${h}h ${rest}min`;
  if (h > 0 && rest === 0) return `${h}h`;
  return `${rest} min`;
}
