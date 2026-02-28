import { ShopCard } from "./ShopCard";

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

interface FeaturedShopsProps {
  shops: Shop[];
  onSelectShop: (shopId: string) => void;
}

export function FeaturedShops({ shops, onSelectShop }: FeaturedShopsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Barbearias em Destaque</h2>
        <span className="text-sm text-muted-foreground">{shops.length} lugares</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} onSelect={onSelectShop} />
        ))}
      </div>
    </section>
  );
}
