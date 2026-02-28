import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

interface DateOption {
  id: string;
  dayName: string;
  dayNumber: string;
  month?: string;
  isToday?: boolean;
}

interface DatePickerScrollProps {
  dates: DateOption[];
  selectedDate: string | null;
  onSelect: (id: string) => void;
}

export function DatePickerScroll({ dates, selectedDate, onSelect }: DatePickerScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to selected date on mount
    if (scrollRef.current && selectedDate) {
      const selectedElement = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {dates.map((date) => (
        <button
          key={date.id}
          data-date={date.id}
          onClick={() => onSelect(date.id)}
          className={cn(
            "flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all",
            selectedDate === date.id
              ? "bg-primary border-primary text-primary-foreground glow-amber"
              : "bg-secondary border-border text-foreground hover:border-primary/50"
          )}
        >
          <span className={cn(
            "text-xs font-medium uppercase",
            selectedDate === date.id ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {date.dayName}
          </span>
          <span className="text-xl font-bold mt-0.5">{date.dayNumber}</span>
          {date.isToday && (
            <span className={cn(
              "text-[10px] font-medium mt-0.5",
              selectedDate === date.id ? "text-primary-foreground/80" : "text-primary"
            )}>
              Hoje
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
