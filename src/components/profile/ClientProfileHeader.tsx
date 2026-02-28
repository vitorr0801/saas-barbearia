import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ClientProfileHeaderProps {
  name: string;
  memberSince: string;
  avatarUrl?: string;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function ClientProfileHeader({ name, memberSince, avatarUrl, isEditing, onToggleEdit }: ClientProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-secondary text-2xl font-bold text-foreground">
            {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        {isEditing && (
          <button className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{name}</h1>
        <Badge variant="secondary" className="mt-2 text-xs font-medium text-muted-foreground">
          Membro desde {memberSince}
        </Badge>
      </div>
      <Button
        variant={isEditing ? "default" : "outline"}
        size="sm"
        onClick={onToggleEdit}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        {isEditing ? "Cancelar Edição" : "Editar Perfil"}
      </Button>
    </div>
  );
}
