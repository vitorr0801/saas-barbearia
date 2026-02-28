import { Scissors, Sparkles, Package, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const categories: Category[] = [
  { id: "corte", name: "Corte", icon: <Scissors className="h-5 w-5" /> },
  { id: "barba", name: "Barba", icon: <Sparkles className="h-5 w-5" /> },
  { id: "combo", name: "Combo", icon: <Package className="h-5 w-5" /> },
  { id: "estetica", name: "Estética", icon: <Palette className="h-5 w-5" /> },
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
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">Categorias</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[72px] transition-all duration-200",
              selectedCategory === category.id
                ? "opacity-100"
                : "opacity-70 hover:opacity-100"
            )}
          >
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {category.icon}
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                selectedCategory === category.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
