import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { SearchHub } from "@/components/discovery/SearchHub";
import { ActiveAppointmentCard } from "@/components/discovery/ActiveAppointmentCard";
import { RecentlyVisited } from "@/components/discovery/RecentlyVisited";
import { CategoryNav } from "@/components/discovery/CategoryNav";
import { FeaturedShops } from "@/components/discovery/FeaturedShops";

// Mock data - replace with real data from Supabase
const mockActiveAppointment = {
  id: "apt-1",
  shopName: "Barbearia Retrô",
  serviceName: "Corte + Barba",
  date: "Hoje",
  time: "15:30",
  address: "SQS 308 Bloco A, Brasília - DF",
};

const mockRecentShops = [
  { id: "shop-1", name: "Barbearia Retrô", neighborhood: "Asa Sul", lastVisit: "há 2 semanas", initials: "BR" },
  { id: "shop-2", name: "Corte & Arte", neighborhood: "Sudoeste", lastVisit: "há 1 mês", initials: "CA" },
  { id: "shop-3", name: "Black Style", neighborhood: "Águas Claras", lastVisit: "há 2 meses", initials: "BS" },
];

const mockFeaturedShops = [
  {
    id: "shop-1",
    name: "Barbearia Retrô",
    coverImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=250&fit=crop",
    rating: 4.9,
    reviewCount: 128,
    neighborhood: "Asa Sul",
    startingPrice: 45,
    categories: ["Corte", "Barba"],
  },
  {
    id: "shop-2",
    name: "Corte & Arte",
    coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=250&fit=crop",
    rating: 4.7,
    reviewCount: 89,
    neighborhood: "Sudoeste",
    startingPrice: 50,
    categories: ["Corte", "Estética"],
  },
  {
    id: "shop-3",
    name: "Black Style Barbershop",
    coverImage: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=250&fit=crop",
    rating: 4.8,
    reviewCount: 156,
    neighborhood: "Águas Claras",
    startingPrice: 40,
    categories: ["Corte", "Barba", "Combo"],
  },
  {
    id: "shop-4",
    name: "Gentlemen's Club",
    coverImage: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=250&fit=crop",
    rating: 4.6,
    reviewCount: 72,
    neighborhood: "Noroeste",
    startingPrice: 60,
    categories: ["Estética", "Barba"],
  },
  {
    id: "shop-5",
    name: "Classic Cuts",
    coverImage: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=250&fit=crop",
    rating: 4.5,
    reviewCount: 45,
    neighborhood: "Lago Sul",
    startingPrice: 55,
    categories: ["Corte", "Combo"],
  },
  {
    id: "shop-6",
    name: "Urban Barber",
    coverImage: "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=400&h=250&fit=crop",
    rating: 4.8,
    reviewCount: 98,
    neighborhood: "Asa Norte",
    startingPrice: 48,
    categories: ["Corte", "Barba"],
  },
];

export default function ClientPortal() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter shops based on search and category
  const filteredShops = mockFeaturedShops.filter((shop) => {
    const matchesSearch =
      searchQuery === "" ||
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null ||
      shop.categories.some((cat) => cat.toLowerCase() === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const handleUseLocation = () => {
    toast.success("Buscando barbearias próximas...", {
      description: "Usando sua localização atual",
    });
    // In real implementation, use Geolocation API
  };

  const handleRebook = (shopId: string) => {
    const shop = mockRecentShops.find((s) => s.id === shopId);
    toast.success(`Redirecionando para ${shop?.name}...`);
    // Navigate to shop booking page
    navigate("/");
  };

  const handleSelectShop = (shopId: string) => {
    const shop = mockFeaturedShops.find((s) => s.id === shopId);
    toast.success(`Abrindo ${shop?.name}...`);
    // Navigate to shop page
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-amber flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold text-foreground">BarberPro</h1>
              <p className="text-xs text-muted-foreground">Descubra sua próxima barbearia</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-8">
        {/* Search Hub */}
        <section className="animate-fade-in">
          <SearchHub
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUseLocation={handleUseLocation}
          />
        </section>

        {/* Active Appointment - Conditional */}
        <section className="animate-fade-in" style={{ animationDelay: "50ms" }}>
          <ActiveAppointmentCard appointment={mockActiveAppointment} />
        </section>

        {/* Recently Visited */}
        <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <RecentlyVisited shops={mockRecentShops} onRebook={handleRebook} />
        </section>

        {/* Category Navigation */}
        <section className="animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </section>

        {/* Featured Shops */}
        <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <FeaturedShops shops={filteredShops} onSelectShop={handleSelectShop} />
        </section>
      </div>
    </div>
  );
}
