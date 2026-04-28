export function formatDuration(minutes: number): string {
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
  
    if (hours > 0) {
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ""}`;
    }
    return `${remainingMinutes}min`;
  }