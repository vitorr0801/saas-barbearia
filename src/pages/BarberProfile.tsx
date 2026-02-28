import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarberProfileHeader } from "@/components/profile/BarberProfileHeader";
import { BarberBio } from "@/components/profile/BarberBio";
import { BarberWorkHours } from "@/components/profile/BarberWorkHours";
import { BarberServices } from "@/components/profile/BarberServices";
import { BarberGallery } from "@/components/profile/BarberGallery";
import { BarberSocialLinks } from "@/components/profile/BarberSocialLinks";
import { SaveBar } from "@/components/profile/SaveBar";

const defaultSchedule = {
  seg: { enabled: true, start: "09:00", end: "19:00" },
  ter: { enabled: true, start: "09:00", end: "19:00" },
  qua: { enabled: true, start: "09:00", end: "19:00" },
  qui: { enabled: true, start: "09:00", end: "19:00" },
  sex: { enabled: true, start: "09:00", end: "20:00" },
  sab: { enabled: true, start: "08:00", end: "17:00" },
};

const shopServices = [
  { id: "1", name: "Corte de Cabelo", price: 45, duration: 30 },
  { id: "2", name: "Barba Completa", price: 35, duration: 25 },
  { id: "3", name: "Combo (Corte + Barba)", price: 70, duration: 50 },
  { id: "4", name: "Degradê", price: 55, duration: 40 },
  { id: "5", name: "Platinado", price: 120, duration: 90 },
  { id: "6", name: "Sobrancelha", price: 20, duration: 15 },
];

export default function BarberProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [bio, setBio] = useState("Barbeiro profissional há 8 anos, especializado em degradê e cortes modernos. Apaixonado por transformar o visual dos meus clientes.");
  const [specialties, setSpecialties] = useState(["Degradê", "Barba Terapêutica", "Visagismo"]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [activeServiceIds, setActiveServiceIds] = useState(["1", "2", "3", "4"]);
  const [instagram, setInstagram] = useState("@rafael.barber");
  const [portfolio, setPortfolio] = useState("https://rafael.barber.co");

  const markChanged = () => setHasChanges(true);

  const handleScheduleChange = (day: string, field: string, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value },
    }));
    markChanged();
  };

  const toggleService = (id: string) => {
    setActiveServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    markChanged();
  };

  const handleSave = () => {
    setHasChanges(false);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur-lg px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Perfil Profissional</h1>
      </div>

      <div className="mx-auto max-w-lg px-4 space-y-5 mt-1">
        <BarberProfileHeader
          name="Rafael Lima"
          rating={4.9}
          reviewCount={127}
          isEditing={isEditing}
          onToggleEdit={() => {
            setIsEditing(!isEditing);
            if (isEditing) setHasChanges(false);
          }}
        />
        <BarberBio
          isEditing={isEditing}
          bio={bio}
          specialties={specialties}
          onBioChange={(v) => { setBio(v); markChanged(); }}
          onSpecialtiesChange={(v) => { setSpecialties(v); markChanged(); }}
        />
        <BarberWorkHours
          isEditing={isEditing}
          schedule={schedule}
          onChange={handleScheduleChange}
        />
        <BarberServices
          isEditing={isEditing}
          allServices={shopServices}
          activeIds={activeServiceIds}
          onToggle={toggleService}
        />
        <BarberGallery isEditing={isEditing} images={[]} />
        <BarberSocialLinks
          isEditing={isEditing}
          instagram={instagram}
          portfolio={portfolio}
          onInstagramChange={(v) => { setInstagram(v); markChanged(); }}
          onPortfolioChange={(v) => { setPortfolio(v); markChanged(); }}
        />
      </div>

      <SaveBar visible={isEditing && hasChanges} onSave={handleSave} />
    </div>
  );
}
