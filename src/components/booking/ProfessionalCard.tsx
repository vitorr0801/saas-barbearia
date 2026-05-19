"use client"

import React, { useMemo } from "react"; // 🚀 Injetado useMemo para otimização de renderização de strings
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  avatar?: string;
  specialty?: string;
  priceDisplay?: string; 
}

interface ProfessionalCardProps {
  professional: Professional;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ProfessionalCard({ professional, isSelected, onSelect }: ProfessionalCardProps) {
  
  // 🚀 ALGORITMO TIER-1: Extrator de Iniciais Definitivo (Garante estritamente Primeiro + Último caractere)
  const displayInitials = useMemo(() => {
    const tokens = professional.name.trim().split(/\s+/);
    if (tokens.length === 0) return "";
    if (tokens.length === 1) return (tokens[0][0] || "").toUpperCase();
    
    const firstInitial = tokens[0][0] || "";
    const lastInitial = tokens[tokens.length - 1][0] || "";
    
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [professional.name]);

  return (
    <button
      onClick={() => onSelect(professional.id)}
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border shrink-0 min-w-[120px] max-w-[140px]",
        isSelected 
          ? "bg-primary/5 border-primary shadow-lg shadow-primary/10 scale-[1.02]" 
          : "bg-card border-border hover:border-primary/40 hover:scale-[1.01]"
      )}
    >
      <div className="relative">
        <Avatar className={cn(
          "h-16 w-16 ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
          isSelected ? "ring-primary" : "ring-transparent"
        )}>
          <AvatarImage src={professional.avatar} alt={`Avatar de ${professional.name}`} className="object-cover" />
          <AvatarFallback className="bg-secondary text-foreground font-black text-base tracking-wider select-none">
            {displayInitials}
          </AvatarFallback>
        </Avatar>
        
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md animate-in zoom-in-50 duration-300">
            <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3]" />
          </div>
        )}
      </div>
      
      <div className="text-center space-y-1 w-full min-w-0">
        {/* 🚀 UX/UI PREMIUM: Trava de corte com title nativo para não deformar a altura do card */}
        <p 
          className={cn(
            "font-black text-xs uppercase tracking-tight truncate block w-full transition-colors", 
            isSelected ? "text-primary" : "text-foreground"
          )}
          title={professional.name}
        >
          {professional.name}
        </p>
        
        {professional.priceDisplay && (
          <p className="text-[10px] font-black text-emerald-500 tracking-widest leading-none">
            {professional.priceDisplay}
          </p>
        )}
      </div>
    </button>
  );
}