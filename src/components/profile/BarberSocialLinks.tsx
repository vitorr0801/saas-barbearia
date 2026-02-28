import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Link2, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface BarberSocialLinksProps {
  isEditing: boolean;
  instagram: string;
  portfolio: string;
  onInstagramChange: (value: string) => void;
  onPortfolioChange: (value: string) => void;
}

export function BarberSocialLinks({ isEditing, instagram, portfolio, onInstagramChange, onPortfolioChange }: BarberSocialLinksProps) {
  const [savedField, setSavedField] = useState<string | null>(null);

  useEffect(() => { setSavedField(null); }, [isEditing]);

  const handleChange = (field: string, setter: (v: string) => void, value: string) => {
    setter(value);
    setSavedField(field);
    setTimeout(() => setSavedField(null), 1500);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Redes Sociais</h2>
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground flex items-center gap-2">
          <Instagram className="h-4 w-4" /> Instagram
        </Label>
        <div className="relative">
          <Input
            value={instagram}
            readOnly={!isEditing}
            onChange={(e) => handleChange("ig", onInstagramChange, e.target.value)}
            placeholder="@seu.perfil"
            className={`bg-secondary/50 border-border text-foreground ${
              isEditing ? "border-primary/50" : "cursor-default opacity-80"
            }`}
          />
          {savedField === "ig" && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400 animate-fade-in" />}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Portfólio / Site
        </Label>
        <div className="relative">
          <Input
            value={portfolio}
            readOnly={!isEditing}
            onChange={(e) => handleChange("pf", onPortfolioChange, e.target.value)}
            placeholder="https://..."
            className={`bg-secondary/50 border-border text-foreground ${
              isEditing ? "border-primary/50" : "cursor-default opacity-80"
            }`}
          />
          {savedField === "pf" && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400 animate-fade-in" />}
        </div>
      </div>
    </div>
  );
}
