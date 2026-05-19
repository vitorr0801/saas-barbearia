import { Scissors, Sparkles, Package, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// Reduzimos levemente o ícone (w-4 h-4) para ficar elegante dentro da pílula
const categories: Category[] = [
  { id: "corte", name: "Corte", icon: <Scissors className="w-4 h-4" /> },
  { id: "barba", name: "Barba", icon: <Sparkles className="w-4 h-4" /> },
  { id: "combo", name: "Combo", icon: <Package className="w-4 h-4" /> },
  { id: "estetica", name: "Estética", icon: <Palette className="w-4 h-4" /> },
];

interface CategoryNavProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryNav({ selectedCategory, onSelectCategory }: CategoryNavProps) {
  const handleSelect = (id: string) => {
    onSelectCategory(selectedCategory === id ? null : id);
  };

  return (
    <section className="w-full flex justify-center sm:justify-start">
      {/* O container de pílulas (Snap Scroll para mobile) */}
      <div 
        className="flex gap-3 overflow-x-auto pb-2 px-1 w-full max-w-3xl mx-auto snap-x" 
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={cn(
                "snap-start whitespace-nowrap inline-flex items-center gap-2.5 px-5 py-3 rounded-full border transition-all duration-300 active:scale-95 cursor-pointer",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-card/40 backdrop-blur-sm border-white/5 text-muted-foreground hover:bg-card hover:border-white/10 hover:text-white"
              )}
            >
              <span className={cn(
                "transition-colors", 
                isSelected ? "text-primary-foreground" : "text-primary/70"
              )}>
                {category.icon}
              </span>
              <span className={cn(
                "text-[11px] font-black uppercase tracking-widest",
                isSelected ? "text-primary-foreground" : ""
              )}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Estilo embutido para esconder a barra de rolagem no Webkit (Chrome/Safari) mantendo a funcionalidade */}
      <style dangerouslySetInnerHTML={{__html: `
        div::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}