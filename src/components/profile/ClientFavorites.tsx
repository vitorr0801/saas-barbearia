import { Heart, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const favorites = [
  { type: "shop" as const, name: "Barbearia Central", detail: "Sudoeste", rating: 4.9 },
  { type: "shop" as const, name: "Studio Barber", detail: "Águas Claras", rating: 4.7 },
  { type: "barber" as const, name: "Rafael Lima", detail: "Barbearia Central", rating: 5.0 },
];

export function ClientFavorites() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        Favoritos
      </h2>
      <div className="space-y-3">
        {favorites.map((fav, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-secondary text-sm font-semibold text-foreground">
                  {fav.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{fav.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{fav.detail}</p>
                  <span className="flex items-center gap-0.5 text-xs text-primary">
                    <Star className="h-3 w-3 fill-primary" />
                    {fav.rating}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reagendar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
