"use client"

import React from "react"
import { cn } from "@/lib/utils";
import { Clock, Check, Tag, Info } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  duration: string;
  priceDisplay: string;
  promoText: string | null;
  description?: string | null; 
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onShowDetails: (service: Service) => void; // 🚀 TIER-1: Nova função para abrir o Modal
}

export function ServiceCard({ service, isSelected, onSelect, onShowDetails }: ServiceCardProps) {
  const hasDescription = service.description && service.description.trim() !== "";

  return (
    <button
      onClick={() => onSelect(service.id)}
      type="button"
      aria-pressed={isSelected}
      className={cn(
        // 🚀 TIER-1: Retornamos o h-full e justify-between. Simetria MUNDIAL restaurada!
        "w-full text-left p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden select-none group flex flex-col justify-between h-full min-h-[140px]",
        "active:scale-[0.98] hover:scale-[1.02]",
        isSelected 
          ? "bg-primary/10 border-primary shadow-xl shadow-primary/10" 
          : "bg-card border-border/50 hover:border-primary/40 hover:bg-secondary/20"
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 pointer-events-none",
        isSelected && "opacity-100"
      )} />

      <div className="flex items-start justify-between relative z-10 gap-4 w-full">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-base font-black tracking-tight uppercase leading-tight mb-1.5 transition-colors break-words line-clamp-2", 
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {service.name}
          </h3>
          
          {/* 🚀 UX Limpa: Mostramos apenas 1 linha truncada e o botão de Saiba Mais */}
          {hasDescription && (
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-[11px] font-medium text-muted-foreground line-clamp-1 break-words">
                {service.description}
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 pt-0.5 flex flex-col items-center gap-3">
          <div className={cn(
            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            isSelected 
              ? "border-primary bg-primary text-primary-foreground scale-110" 
              : "border-muted-foreground/30 bg-transparent scale-100 group-hover:border-primary/50"
          )}>
            <Check className={cn("h-3.5 w-3.5 transition-opacity", isSelected ? "opacity-100" : "opacity-0")} />
          </div>
        </div>
      </div>

      {/* Botão de Saiba Mais + Preço e Tempo */}
      <div className="flex flex-col gap-3 relative z-10 w-full mt-auto pt-4 border-t border-border/50">
        
        {hasDescription && (
          <div 
            onClick={(e) => {
              e.stopPropagation(); // 🛡️ Evita que clicar em "Saiba mais" selecione o serviço
              onShowDetails(service);
            }}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/80 hover:text-primary transition-colors cursor-pointer w-fit"
          >
            <Info className="w-3.5 h-3.5" /> Saiba mais
          </div>
        )}

        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5" /> {service.duration}
            </span>

            {service.promoText && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                <Tag className="w-3 h-3" /> {service.promoText}
              </div>
            )}
          </div>

          <span className={cn(
            "text-lg font-black tracking-tighter tabular-nums",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {service.priceDisplay}
          </span>
        </div>
      </div>
    </button>
  );
}