import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchHubProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUseLocation: () => void;
}

export function SearchHub({ searchQuery, onSearchChange, onUseLocation }: SearchHubProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Encontre a melhor barbearia em Brasília..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-14 bg-card border-border text-foreground placeholder:text-muted-foreground text-base rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <Button
        variant="outline"
        onClick={onUseLocation}
        className="w-full h-12 border-border bg-card hover:bg-accent hover:text-accent-foreground gap-2 rounded-xl"
      >
        <MapPin className="h-4 w-4 text-primary" />
        <span>Usar minha localização</span>
      </Button>
    </div>
  );
}
