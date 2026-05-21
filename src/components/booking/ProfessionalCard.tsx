// src/components/booking/ProfessionalCard.tsx
"use client"
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Instagram } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  avatar?: string;
  instagram?: string | null;
  priceDisplay?: string;
}

interface ProfessionalCardProps {
  professional: Professional;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ProfessionalCard({ professional, isSelected, onSelect }: ProfessionalCardProps) {
  const displayInitials = useMemo(() => {
    const tokens = professional.name.trim().split(/\s+/);
    if (tokens.length === 0) return "";
    if (tokens.length === 1) return (tokens[0][0] || "").toUpperCase();
    return `${tokens[0][0] || ""}${tokens[tokens.length - 1][0] || ""}`.toUpperCase();
  }, [professional.name]);

  // Aceita 3 formatos salvos no banco:
  // 1. URL completa: "https://www.instagram.com/_.mazza_/"
  // 2. Handle com @: "@_.mazza_"
  // 3. Handle puro: "_.mazza_"
  const instagramHandle = useMemo(() => {
    const raw = professional.instagram;
    if (!raw) return null;
    const urlMatch = raw.match(/instagram\.com\/([^/?#]+)/i);
    if (urlMatch) return urlMatch[1].replace(/\/$/, "");
    return raw.replace(/^@/, "").trim() || null;
  }, [professional.instagram]);

  const handleInstagramClick = (e: React.MouseEvent) => {
    // Impede que o clique no Instagram acione o onSelect do card
    e.stopPropagation();
    if (instagramHandle) {
      window.open(`https://instagram.com/${instagramHandle}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={() => onSelect(professional.id)}
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border shrink-0 w-full",
        isSelected
          ? "bg-primary/5 border-primary shadow-lg shadow-primary/10 scale-[1.02]"
          : "bg-card border-border hover:border-primary/40 hover:scale-[1.01]"
      )}
    >
      {/* Avatar com foto real */}
      <div className="relative">
        <Avatar className={cn(
          "h-16 w-16 ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
          isSelected ? "ring-primary" : "ring-transparent"
        )}>
          <AvatarImage
            src={professional.avatar}
            alt={`Foto de ${professional.name}`}
            className="object-cover object-center w-full h-full"
          />
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

      {/* Nome e preço */}
      <div className="text-center space-y-1 w-full min-w-0">
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

      {/* ✅ Botão Instagram — só aparece se o barbeiro tem @ cadastrado */}
      {instagramHandle && (
        <div
          role="link"
          onClick={handleInstagramClick}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all w-full justify-center",
            "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20",
            "hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-500/40",
            "text-purple-400 hover:text-purple-300"
          )}
          title={`Ver trabalhos de @${instagramHandle}`}
        >
          <Instagram className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[80px]">@{instagramHandle}</span>
        </div>
      )}
    </button>
  );
}