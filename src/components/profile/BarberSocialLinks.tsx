import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface BarberSocialLinksProps {
  isEditing: boolean;
  instagram: string;
  onInstagramChange: (value: string) => void;
}

export function BarberSocialLinks({ isEditing, instagram, onInstagramChange }: BarberSocialLinksProps) {
  const [savedField, setSavedField] = useState<string | null>(null);

  useEffect(() => { setSavedField(null); }, [isEditing]);

  const handleChange = (field: string, setter: (v: string) => void, value: string) => {
    setter(value);
    setSavedField(field);
    setTimeout(() => setSavedField(null), 1500);
  };

  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-sm space-y-4">
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
            className={`bg-secondary/50 border-border text-foreground rounded-xl h-12 ${
              isEditing ? "border-primary/50" : "cursor-default opacity-80"
            }`}
          />
          {savedField === "ig" && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400 animate-fade-in" />}
        </div>
      </div>
    </div>
  );
}