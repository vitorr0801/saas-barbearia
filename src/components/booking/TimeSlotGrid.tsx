"use client"

import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  promoPercentage?: number | null; // 🚀 Recebe a porcentagem
}

export function TimeSlotGrid({ slots, selectedSlot, onSelect, isLoading, emptyMessage, promoPercentage }: TimeSlotGridProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-12 w-full bg-secondary/50 animate-pulse rounded-xl border border-border/50" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-4 bg-secondary/20 rounded-2xl border border-dashed border-border mt-4">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          {emptyMessage ?? "Nenhum horário disponível"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-x-3 gap-y-4 mt-6">
      {slots.map((slot) => (
        <div key={slot.id} className="relative w-full flex justify-center">
          
          {/* 🚀 TAG DE PROMOÇÃO COLADA NO QUADRADO */}
          {promoPercentage && promoPercentage > 0 && slot.available && (
            <div className="absolute -top-3 -right-2 z-10 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md pointer-events-none">
              {promoPercentage.toFixed(0)}%
            </div>
          )}
          
          <button
            type="button"
            onClick={() => slot.available && onSelect(slot.id)}
            disabled={!slot.available}
            className={cn(
              "h-11 w-full rounded-xl text-[12px] font-bold transition-all border shrink-0 uppercase tracking-tighter relative",
              selectedSlot === slot.id 
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-95" 
                : "bg-card border-border text-foreground hover:border-primary/50",
              !slot.available && "opacity-30 cursor-not-allowed bg-secondary grayscale line-through border-transparent"
            )}
          >
            {slot.time}
          </button>
        </div>
      ))}
    </div>
  );
}