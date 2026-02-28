import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarberProfileHeaderProps {
  name: string;
  rating: number;
  reviewCount: number;
  avatarUrl?: string;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function BarberProfileHeader({ name, rating, reviewCount, avatarUrl, isEditing, onToggleEdit }: BarberProfileHeaderProps) {
  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Cover gradient */}
      <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />

      <div className="px-5 pb-5 -mt-14">
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-card">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-secondary text-3xl font-bold text-foreground">
                {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <button className="absolute bottom-1 right-1 rounded-full bg-primary p-1.5 text-primary-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={onToggleEdit}
            className="gap-2 mb-2"
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? "Cancelar" : "Editar"}
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-foreground">{name}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-primary text-primary" : "text-border"}`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">{rating}</span>
          <span className="text-sm text-muted-foreground">({reviewCount} avaliações)</span>
        </div>
      </div>
    </div>
  );
}
