"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarberProfileHeader } from "@/components/profile/BarberProfileHeader";
import { BarberBio } from "@/components/profile/BarberBio";
import { BarberWorkHours } from "@/components/profile/BarberWorkHours";
import { BarberGallery } from "@/components/profile/BarberGallery";
import { BarberSocialLinks } from "@/components/profile/BarberSocialLinks";
import { ClientPersonalInfo } from "@/components/profile/ClientPersonalInfo";
import { SaveBar } from "@/components/profile/SaveBar";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { listMyServiceToggles, toggleMyService, type MasterService } from "@/lib/services-client";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatDuration";
import { WORK_DAY_KEYS, type WorkDayKey } from "@/constants/workHours";

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

const defaultSchedule: Record<WorkDayKey, { enabled: boolean; start: string; end: string }> = {
  dom: { enabled: false, start: "09:00", end: "19:00" },
  seg: { enabled: true, start: "09:00", end: "19:00" },
  ter: { enabled: true, start: "09:00", end: "19:00" },
  qua: { enabled: true, start: "09:00", end: "19:00" },
  qui: { enabled: true, start: "09:00", end: "19:00" },
  sex: { enabled: true, start: "09:00", end: "20:00" },
  sab: { enabled: true, start: "08:00", end: "17:00" },
};

function normalizeTimeForSelect(value: unknown, fallback: string): string {
  if (value == null || value === "") return fallback;
  const s = String(value).trim();
  if (s.length >= 5) return s.slice(0, 5);
  return fallback;
}

function toPostgresTime(hhmm: string): string {
  const t = hhmm.trim();
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return t;
}

function normalizeDayKey(raw: unknown): WorkDayKey | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const byNum: Record<number, WorkDayKey> = { 0: "dom", 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab", 7: "dom" };
    if (raw in byNum) return byNum[raw];
  }
  const s = String(raw).toLowerCase().trim();
  if (WORK_DAY_KEYS.includes(s as WorkDayKey)) return s as WorkDayKey;
  const aliases: Record<string, WorkDayKey> = {
    domingo: "dom", sunday: "dom", sun: "dom",
    segunda: "seg", monday: "seg", mon: "seg",
    "terça": "ter", terca: "ter", tuesday: "ter", tue: "ter",
    quarta: "qua", wednesday: "qua", wed: "qua",
    quinta: "qui", thursday: "qui", thu: "qui",
    sexta: "sex", friday: "sex", fri: "sex",
    sábado: "sab", sabado: "sab", saturday: "sab", sat: "sab",
  };
  return aliases[s] ?? null;
}

function buildScheduleFromDbRows(rows: Array<{ day: unknown; start_time: unknown; end_time: unknown }>): typeof defaultSchedule {
  const base: Record<string, { enabled: boolean; start: string; end: string }> = {};
  for (const key of WORK_DAY_KEYS) {
    base[key] = { enabled: false, start: defaultSchedule[key].start, end: defaultSchedule[key].end };
  }
  for (const row of rows) {
    const dayKey = normalizeDayKey(row.day);
    if (!dayKey || !base[dayKey]) continue;
    const def = defaultSchedule[dayKey];
    base[dayKey] = {
      enabled: true,
      start: normalizeTimeForSelect(row.start_time, def.start),
      end: normalizeTimeForSelect(row.end_time, def.end),
    };
  }
  return base as typeof defaultSchedule;
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
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [masterServices, setMasterServices] = useState<MasterService[]>([]);
  // 🚀 TIER-1: Guardamos o estado inicial para comparar o que realmente mudou na hora de salvar
  const [initialServiceIds, setInitialServiceIds] = useState<string[]>([]);
  const [activeServiceIds, setActiveServiceIds] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

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

      try {
        const { data: hours, error: hoursErr } = await supabase
          .from("barber_work_hours")
          .select("day_of_week, start_time, end_time")
          .eq("barber_id", user.id);

        if (hoursErr) {
          console.warn("[Profile] Sem horários customizados ou erro leve:", hoursErr);
        } else {
          const rows = (hours ?? []).map((row: any) => ({
            day: row.day_of_week, 
            start_time: row.start_time,
            end_time: row.end_time,
          }));
          setSchedule(buildScheduleFromDbRows(rows));
        }
      } catch (hoursCatchErr) {
        console.warn("[Profile] Falha isolada nos horários:", hoursCatchErr);
      }

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

  const handleScheduleChange = (day: string, field: string, value: string | boolean) => {
    setSchedule((prev) => {
      const key = day as WorkDayKey;
      const current = prev[key];
      if (!current) return prev;

      if (field === "enabled" && value === false) {
        const defaults = defaultSchedule[key];
        return { ...prev, [day]: { enabled: false, start: defaults.start, end: defaults.end } };
      }
      return { ...prev, [day]: { ...current, [field]: value } };
    });
    markChanged();
  };

  // 🚀 TIER-1: Mutação Local Pura (Não atinge o banco até clicar em Salvar)
  const handleToggleService = (serviceId: string, next: boolean) => {
    if (!isEditing) return; // Trava contra cliques acidentais fora do modo edição
    
    setActiveServiceIds((prev) => {
      const set = new Set(prev);
      if (next) set.add(serviceId);
      else set.delete(serviceId);
      return Array.from(set);
    });
    markChanged(); // Ativa a barra verde inferior!
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    const parsed = profileSchema.safeParse(accountData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando perfil completo...");
    
    try {
      // 1. Salva Informações do Perfil
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

      // 2. Limpeza Bruta de Horários (Bulk Delete)
      const { error: deleteError } = await supabase
        .from("barber_work_hours")
        .delete()
        .eq("barber_id", currentUser.id);

      if (deleteError) throw new Error("Falha ao limpar agenda anterior.");

      const dayToInt: Record<string, number> = {
        dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6
      };

      // 3. Monta o Array de Horários convertendo para inteiros
      const activeHoursToInsert = WORK_DAY_KEYS
        .filter(day => schedule[day]?.enabled)
        .map(day => ({
          barber_id: currentUser.id,
          day_of_week: dayToInt[day],
          start_time: toPostgresTime(schedule[day].start),
          end_time: toPostgresTime(schedule[day].end),
        }));

      // 4. Inserção em Massa (Bulk Insert) de Horários
      if (activeHoursToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("barber_work_hours")
          .insert(activeHoursToInsert);
        if (insertError) throw new Error("Falha ao registrar novos horários.");
      }

      // 🚀 5. TIER-1: Sincronização em Lote de Serviços (Bulk Update)
      // Descobre o que entrou e o que saiu comparando com o snapshot inicial
      const addedServices = activeServiceIds.filter(id => !initialServiceIds.includes(id));
      const removedServices = initialServiceIds.filter(id => !activeServiceIds.includes(id));

      if (addedServices.length > 0 || removedServices.length > 0) {
        const togglePromises = [
          ...addedServices.map(id => toggleMyService(id, true)),
          ...removedServices.map(id => toggleMyService(id, false))
        ];

        // Resolve tudo em paralelo para máxima velocidade
        const toggleResults = await Promise.all(togglePromises);
        const firstError = toggleResults.find(r => r.error);
        if (firstError) throw new Error("Falha ao sincronizar seus serviços.");
        
        // Atualiza o ponto de referência
        setInitialServiceIds(activeServiceIds);
      }

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

  const loadMyServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const { services, activeServiceIds, error } = await listMyServiceToggles();
      if (error) throw new Error(error);
      setMasterServices(services);
      setActiveServiceIds(activeServiceIds);
      setInitialServiceIds(activeServiceIds); // 🚀 Guarda a foto inicial do banco
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar serviços.";
      console.warn("[Profile] Serviços não carregados:", msg);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyServices();
  }, [loadMyServices]);

  const activeSet = useMemo(() => new Set(activeServiceIds), [activeServiceIds]);

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
                onBioChange={(v) => { setBio(v); markChanged(); }}
                onSpecialtiesChange={(v) => { setSpecialties(v); markChanged(); }}
              />
              <BarberWorkHours
                isEditing={isEditing}
                schedule={schedule}
                onChange={handleScheduleChange}
              />

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Scissors className="h-5 w-5 text-primary" />
                  Meus Serviços
                </h2>
                {servicesLoading ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">Carregando serviços...</div>
                ) : masterServices.length === 0 ? (
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                    Nenhum serviço master cadastrado pela barbearia ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {masterServices.map((svc) => {
                      const isOn = activeSet.has(svc.id);
                      return (
                        <div key={svc.id} className={cn("flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors", isOn ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/20")}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{svc.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              R$ {Number(svc.price).toFixed(2).replace(".", ",")} • {formatDuration(svc.duration_min)}
                            </p>
                          </div>
                          <Switch 
                            checked={isOn} 
                            onCheckedChange={(next) => handleToggleService(svc.id, next)} 
                            disabled={!isEditing} // 🚀 Bloqueia se o barbeiro não estiver no modo de edição
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <BarberGallery isEditing={isEditing} images={[]} />
              <BarberSocialLinks
                isEditing={isEditing}
                instagram={instagram}
                portfolio={portfolio}
                onInstagramChange={(v) => { setInstagram(v); markChanged(); }}
                onPortfolioChange={(v) => { setPortfolio(v); markChanged(); }}
              />
            </>
          )}
        </div>

        <SaveBar visible={isEditing && hasChanges} onSave={handleSave} isLoading={isSaving} />
      </div>
    </AppLayout>
  );
}