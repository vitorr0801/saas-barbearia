import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";

interface BarberBioProps {
  isEditing: boolean;
  bio: string;
  specialties: string[];
  onBioChange: (value: string) => void;
  onSpecialtiesChange: (value: string[]) => void;
}

const allSpecialties = [
  "Degradê", "Barba Terapêutica", "Visagismo", "Corte Infantil",
  "Coloração", "Alisamento", "Tranças", "Platinado",
];

export function BarberBio({ isEditing, bio, specialties, onBioChange, onSpecialtiesChange }: BarberBioProps) {
  const [saved, setSaved] = useState(false);

  const toggleSpecialty = (spec: string) => {
    if (!isEditing) return;
    const updated = specialties.includes(spec)
      ? specialties.filter(s => s !== spec)
      : [...specialties, spec];
    onSpecialtiesChange(updated);
  };

  useEffect(() => { setSaved(false); }, [isEditing]);

  const handleBioChange = (value: string) => {
    onBioChange(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-foreground">Sobre mim</h2>
          {saved && <Check className="h-4 w-4 text-green-400 animate-fade-in" />}
        </div>
        <Textarea
          value={bio}
          readOnly={!isEditing}
          onChange={(e) => handleBioChange(e.target.value)}
          className={`bg-secondary/50 border-border text-foreground min-h-[100px] resize-none transition-all ${
            isEditing ? "border-primary/50 focus:border-primary" : "cursor-default opacity-80"
          }`}
          placeholder="Conte um pouco sobre sua experiência..."
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Especialidades</h3>
        <div className="flex flex-wrap gap-2">
          {allSpecialties.map((spec) => {
            const isActive = specialties.includes(spec);
            return (
              <Badge
                key={spec}
                variant={isActive ? "default" : "secondary"}
                className={`cursor-pointer transition-all text-xs py-1.5 px-3 ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                } ${!isEditing && "pointer-events-none"}`}
                onClick={() => toggleSpecialty(spec)}
              >
                {spec}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
