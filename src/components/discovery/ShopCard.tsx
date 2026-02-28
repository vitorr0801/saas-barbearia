import { Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Shop {
  id: string;
  name: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  neighborhood: string;
  startingPrice: number;
  categories: string[];
}

interface ShopCardProps {
  shop: Shop;
  onSelect: (shopId: string) => void;
}

export function ShopCard({ shop, onSelect }: ShopCardProps) {
  return (
    <Card
      className="bg-card border-border overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
      onClick={() => onSelect(shop.id)}
    >
      <AspectRatio ratio={16 / 10}>
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${shop.coverImage})`,
            backgroundColor: "hsl(var(--muted))",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute top-2 right-2">
            <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-0 gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {shop.rating.toFixed(1)}
            </Badge>
          </div>
        </div>
      </AspectRatio>
      <CardContent className="p-3">
        <h3 className="font-bold text-foreground truncate mb-1">{shop.name}</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{shop.neighborhood}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {shop.categories.slice(0, 2).map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="text-xs px-1.5 py-0"
              >
                {cat}
              </Badge>
            ))}
          </div>
          <span className="text-primary font-semibold text-sm whitespace-nowrap">
            A partir de R$ {shop.startingPrice}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
