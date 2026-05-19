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
    <div className="relative flex items-center w-full max-w-3xl mx-auto group">
      {/* Ícone de Busca (Lupa) */}
      <Search className="absolute left-4 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
      
      {/* O Input de Elite */}
      <Input
        placeholder="Encontre a melhor barbearia em Brasília..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-12 pr-[60px] sm:pr-[140px] h-14 bg-card/50 backdrop-blur-sm border-border/50 text-foreground placeholder:text-muted-foreground/50 text-base rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-sm hover:border-border/80"
      />
      
      {/* Botão de Localização Aninhado (Padrão Uber/iFood) */}
      <div className="absolute right-2 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUseLocation}
          className="h-10 px-3 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border border-primary/20 rounded-xl flex items-center gap-2 transition-all active:scale-95"
          title="Buscar perto de mim"
        >
          <MapPin className="h-4 w-4" />
          {/* O texto some no celular para não espremer a barra de busca */}
          <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest">
            Perto de mim
          </span>
        </Button>
      </div>
    </div>
  );
}