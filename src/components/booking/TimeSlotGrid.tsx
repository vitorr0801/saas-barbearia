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
  isLoading?: boolean; // 👈 Adicionado como opcional para evitar quebras
  emptyMessage?: string;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelect, isLoading, emptyMessage }: TimeSlotGridProps) {
  
  // 🌀 EFEITO DE SKELETON (PADRÃO DE ELITE)
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div 
            key={i} 
            className="h-10 w-full bg-secondary/50 animate-pulse rounded-xl border border-border/50" 
          />
        ))}
      </div>
    );
  }

  // 📭 ESTADO VAZIO
  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-4 bg-secondary/20 rounded-2xl border border-dashed border-border">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          {emptyMessage ?? "Nenhum horário disponível"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          onClick={() => slot.available && onSelect(slot.id)}
          disabled={!slot.available}
          className={cn(
            "h-10 rounded-xl text-[11px] font-bold transition-all border shrink-0 uppercase tracking-tighter",
            // Estado Selecionado
            selectedSlot === slot.id 
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-95" 
              : "bg-card border-border text-foreground hover:border-primary/50",
            // Estado Indisponível
            !slot.available && "opacity-30 cursor-not-allowed bg-secondary grayscale line-through border-transparent"
          )}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}