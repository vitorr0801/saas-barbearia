"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle } from "lucide-react"; // 🚀 Injetado para o Header Executivo
import { useNavigate } from "react-router-dom";
import { BarberProfileHeader } from "@/components/profile/BarberProfileHeader";
import { BarberBio } from "@/components/profile/BarberBio";
import { BarberGallery } from "@/components/profile/BarberGallery";
import { BarberSocialLinks } from "@/components/profile/BarberSocialLinks";
import { ClientPersonalInfo } from "@/components/profile/ClientPersonalInfo";
import { SaveBar } from "@/components/profile/SaveBar";
// 🗑️ IMPORT APAGADO: import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  whatsapp: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 0 || value.length === 11, {
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

export default function BarberProfile() {
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [accountData, setAccountData] = useState({ name: "", whatsapp: "", cpf: "", email: "" });
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const loadProfileFromSupabase = useCallback(async () => {
    setProfileLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Sessão inválida.");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, phone, cpf, email, instagram")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) console.warn("[Profile] Erro leve ao buscar perfil:", profileError);

      let fallbackName = "";
      if (user.user_metadata?.full_name || user.user_metadata?.name) {
        fallbackName = user.user_metadata.full_name || user.user_metadata.name;
      } else if (user.email) {
        const prefix = user.email.split('@')[0];
        fallbackName = prefix.split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      }

      setAccountData({
        name: profileData?.name || fallbackName,
        whatsapp: formatWhatsApp(profileData?.phone ?? ""),
        cpf: profileData?.cpf ?? "",
        email: profileData?.email ?? user.email ?? "",
      });

      setInstagram((profileData as any)?.instagram ?? "");

    } catch (err: any) {
      console.error("[Profile] Erro crítico:", err);
      toast.error("Alguns dados puderam não carregar corretamente.");
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
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: parsed.data.name,
          phone: parsed.data.whatsapp,
          cpf: parsed.data.cpf || null,
          instagram: instagram.trim() || null,
        })
        .eq("id", currentUser.id);

      if (profileError) throw new Error("Falha ao salvar dados de cadastro.");

      await refreshUser();
      toast.success("Perfil atualizado com sucesso!", { id: toastId });
      setHasChanges(false);
      setIsEditing(false);
      await loadProfileFromSupabase();

    } catch (e: any) {
      console.error("[Profile Save Error]:", e);
      toast.error(e.message || "Erro inesperado ao salvar.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // 🚀 TAG <AppLayout> REMOVIDA PARA ENCAIXE NA SIDEBAR
    <div className="container max-w-4xl mx-auto space-y-8 overflow-x-hidden pb-10">
      
      {/* 🏁 EXECUTIVE HEADER PADRÃO MUNDIAL */}
      <header className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <UserCircle className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meu Espaço</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Perfil <span className="text-primary">Profissional</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Gerencie seus dados, biografia e portfólio.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {profileLoading ? (
          <div className="rounded-[2rem] border border-border bg-card/30 backdrop-blur-xl p-12 text-center flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
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

            <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Dados Cadastrais
              </p>
              <ClientPersonalInfo
                isEditing={isEditing}
                data={accountData}
                onChange={handleAccountFieldChange}
              />
            </div>

            <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl p-0 shadow-sm overflow-hidden">
              <BarberBio
                isEditing={isEditing}
                bio={bio}
                specialties={specialties}
                onBioChange={(v) => { setBio(v); markChanged(); }}
                onSpecialtiesChange={(v) => { setSpecialties(v); markChanged(); }}
              />
            </div>

            <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl p-0 shadow-sm overflow-hidden">
              <BarberGallery isEditing={isEditing} images={[]} />
            </div>
            
            <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl p-0 shadow-sm overflow-hidden">
              <BarberSocialLinks
                isEditing={isEditing}
                instagram={instagram}
                portfolio={portfolio}
                onInstagramChange={(v) => { setInstagram(v); markChanged(); }}
                onPortfolioChange={(v) => { setPortfolio(v); markChanged(); }}
              />
            </div>
          </div>
        )}
      </div>

      <SaveBar visible={isEditing && hasChanges} onSave={handleSave} isLoading={isSaving} />
    </div>
  );
}