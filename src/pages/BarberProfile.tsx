"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarberProfileHeader } from "@/components/profile/BarberProfileHeader";
import { BarberBio } from "@/components/profile/BarberBio";
import { BarberWorkHours } from "@/components/profile/BarberWorkHours";
import { BarberServices } from "@/components/profile/BarberServices";
import { BarberGallery } from "@/components/profile/BarberGallery";
import { BarberSocialLinks } from "@/components/profile/BarberSocialLinks";
import { ClientPersonalInfo } from "@/components/profile/ClientPersonalInfo";
import { SaveBar } from "@/components/profile/SaveBar";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  whatsapp: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11, {
      message: "WhatsApp deve conter 11 digitos.",
    }),
  cpf: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 0 || value.length === 11, {
      message: "CPF deve conter 11 digitos.",
    }),
});

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

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
  const { currentUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [accountData, setAccountData] = useState({
    name: "",
    whatsapp: "",
    cpf: "",
    email: "",
  });

  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [activeServiceIds, setActiveServiceIds] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const loadProfileFromSupabase = useCallback(async () => {
    setProfileLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Sessão inválida.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("name, phone, cpf, email")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      setAccountData({
        name: data?.name ?? "",
        whatsapp: formatWhatsApp(data?.phone ?? ""),
        cpf: data?.cpf ?? "",
        email: data?.email ?? user.email ?? "",
      });
    } catch {
      toast.error("Não foi possível carregar o perfil.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfileFromSupabase();
  }, [loadProfileFromSupabase]);

  const markChanged = () => setHasChanges(true);

  const handleAccountFieldChange = (field: string, value: string) => {
    setAccountData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleScheduleChange = (day: string, field: string, value: string | boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value },
    }));
    markChanged();
  };

  const toggleService = (id: string) => {
    setActiveServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
    markChanged();
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    const parsed = profileSchema.safeParse(accountData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando perfil...");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: parsed.data.name,
          phone: parsed.data.whatsapp,
          cpf: parsed.data.cpf || null,
        })
        .eq("id", currentUser.id);

      if (error) throw error;

      await refreshUser();
      toast.success("Perfil atualizado!", { id: toastId });
      setHasChanges(false);
      setIsEditing(false);
      await loadProfileFromSupabase();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] pb-24">
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur-lg px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Perfil Profissional</h1>
        </div>

        <div className="mx-auto max-w-lg px-4 space-y-5 mt-1">
          {profileLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Carregando dados do perfil...
            </div>
          ) : (
            <>
              <BarberProfileHeader
                name={accountData.name || "Seu nome"}
                rating={0}
                reviewCount={0}
                isEditing={isEditing}
                onToggleEdit={() => {
                  setIsEditing(!isEditing);
                  if (isEditing) setHasChanges(false);
                }}
              />

              <div className="rounded-xl border border-border bg-card/40 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                  Dados cadastrais (Supabase)
                </p>
                <ClientPersonalInfo
                  isEditing={isEditing}
                  data={accountData}
                  onChange={handleAccountFieldChange}
                />
              </div>

              <p className="text-[10px] text-muted-foreground text-center px-2">
                Bio, horários e serviços abaixo são locais à interface; em breve podem ser ligados ao banco.
              </p>

              <BarberBio
                isEditing={isEditing}
                bio={bio}
                specialties={specialties}
                onBioChange={(v) => {
                  setBio(v);
                  markChanged();
                }}
                onSpecialtiesChange={(v) => {
                  setSpecialties(v);
                  markChanged();
                }}
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
                onInstagramChange={(v) => {
                  setInstagram(v);
                  markChanged();
                }}
                onPortfolioChange={(v) => {
                  setPortfolio(v);
                  markChanged();
                }}
              />
            </>
          )}
        </div>

        <SaveBar visible={isEditing && hasChanges} onSave={handleSave} isLoading={isSaving} />
      </div>
    </AppLayout>
  );
}
