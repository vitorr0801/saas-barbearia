import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClientProfileHeader } from "@/components/profile/ClientProfileHeader";
import { ClientPersonalInfo } from "@/components/profile/ClientPersonalInfo";
import { ClientActivityHub } from "@/components/profile/ClientActivityHub";
import { ClientFavorites } from "@/components/profile/ClientFavorites";
import { SaveBar } from "@/components/profile/SaveBar";

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [data, setData] = useState({
    name: "Lucas Mendes",
    whatsapp: "(61) 99123-4567",
    cpf: "12345678901",
    email: "lucas.mendes@email.com",
  });

  const handleFieldChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur-lg px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Meu Perfil</h1>
      </div>

      <div className="mx-auto max-w-lg px-4 space-y-5">
        <ClientProfileHeader
          name={data.name}
          memberSince="Jan 2024"
          isEditing={isEditing}
          onToggleEdit={() => {
            setIsEditing(!isEditing);
            if (isEditing) setHasChanges(false);
          }}
        />
        <ClientPersonalInfo
          isEditing={isEditing}
          data={data}
          onChange={handleFieldChange}
        />
        <ClientActivityHub />
        <ClientFavorites />
      </div>

      <SaveBar visible={isEditing && hasChanges} onSave={handleSave} />
    </div>
  );
}
