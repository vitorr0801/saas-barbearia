import { RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RecentShop {
  id: string;
  name: string;
  neighborhood: string;
  lastVisit: string;
  initials: string;
}

interface RecentlyVisitedProps {
  shops: RecentShop[];
  onRebook: (shopId: string) => void;
}

export function RecentlyVisited({ shops, onRebook }: RecentlyVisitedProps) {
  if (shops.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3">Visitados Recentemente</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
        {shops.map((shop) => (
          <Card
            key={shop.id}
            className="bg-card border-border min-w-[200px] flex-shrink-0"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {shop.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">
                    {shop.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {shop.neighborhood}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Última visita: {shop.lastVisit}
              </p>
              <Button
                onClick={() => onRebook(shop.id)}
                variant="outline"
                size="sm"
                className="w-full border-primary/50 text-primary hover:bg-primary/10 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Agendar Novamente
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
