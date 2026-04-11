"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
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
import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatDuration";
import { WORK_DAY_KEYS, type WorkDayKey } from "@/constants/workHours";

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

const defaultSchedule: Record<
  WorkDayKey,
  { enabled: boolean; start: string; end: string }
> = {
  dom: { enabled: false, start: "09:00", end: "19:00" },
  seg: { enabled: true, start: "09:00", end: "19:00" },
  ter: { enabled: true, start: "09:00", end: "19:00" },
  qua: { enabled: true, start: "09:00", end: "19:00" },
  qui: { enabled: true, start: "09:00", end: "19:00" },
  sex: { enabled: true, start: "09:00", end: "20:00" },
  sab: { enabled: true, start: "08:00", end: "17:00" },
};

/** Postgres devolve time como "09:00:00"; os <Select> usam "09:00". */
function normalizeTimeForSelect(value: unknown, fallback: string): string {
  if (value == null || value === "") return fallback;
  const s = String(value).trim();
  if (s.length >= 5) return s.slice(0, 5);
  return fallback;
}

/** Enviar para coluna time/timestamptz como HH:MM:SS quando o estado é HH:MM. */
function toPostgresTime(hhmm: string): string {
  const t = hhmm.trim();
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return t;
}

/** Mapeia valor vindo do banco para a chave canônica (mesma usada no save). */
function normalizeDayKey(raw: unknown): WorkDayKey | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = raw as number;
    // JS getDay(): 0=dom … 6=sab
    const byNum: Record<number, WorkDayKey> = {
      0: "dom",
      1: "seg",
      2: "ter",
      3: "qua",
      4: "qui",
      5: "sex",
      6: "sab",
      7: "dom",
    };
    if (n in byNum) return byNum[n];
  }
  const s = String(raw).toLowerCase().trim();
  if (WORK_DAY_KEYS.includes(s as WorkDayKey)) return s as WorkDayKey;
  const aliases: Record<string, WorkDayKey> = {
    domingo: "dom",
    sunday: "dom",
    sun: "dom",
    segunda: "seg",
    monday: "seg",
    mon: "seg",
    "terça": "ter",
    terca: "ter",
    tuesday: "ter",
    tue: "ter",
    quarta: "qua",
    wednesday: "qua",
    wed: "qua",
    quinta: "qui",
    thursday: "qui",
    thu: "qui",
    sexta: "sex",
    friday: "sex",
    fri: "sex",
    sábado: "sab",
    sabado: "sab",
    saturday: "sab",
    sat: "sab",
  };
  const mapped = aliases[s];
  return mapped ?? null;
}

function buildScheduleFromDbRows(
  rows: Array<{ day: unknown; start_time: unknown; end_time: unknown }>,
): typeof defaultSchedule {
  const base: Record<string, { enabled: boolean; start: string; end: string }> = {};
  for (const key of WORK_DAY_KEYS) {
    base[key] = {
      enabled: false,
      start: defaultSchedule[key].start,
      end: defaultSchedule[key].end,
    };
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

  const [accountData, setAccountData] = useState({
    name: "",
    whatsapp: "",
    cpf: "",
    email: "",
  });

  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [masterServices, setMasterServices] = useState<MasterService[]>([]);
  const [activeServiceIds, setActiveServiceIds] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
        .select("name, phone, cpf, email, instagram")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      setAccountData({
        name: data?.name ?? "",
        whatsapp: formatWhatsApp(data?.phone ?? ""),
        cpf: data?.cpf ?? "",
        email: data?.email ?? user.email ?? "",
      });

      setInstagram((data as any)?.instagram ?? "");

      // Horários de trabalho (persistidos)
      const { data: hours, error: hoursErr } = await supabase
        .from("barber_work_hours")
        .select("day, start_time, end_time")
        .eq("barber_id", user.id);

      if (hoursErr) throw hoursErr;

      const rows = (hours ?? []).map((row: any) => ({
        day: row.day,
        start_time: row.start_time,
        end_time: row.end_time,
      }));
      setSchedule(buildScheduleFromDbRows(rows));
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
    setSchedule((prev) => {
      const key = day as WorkDayKey;
      const current = prev[key];
      if (!current) return prev;

      if (field === "enabled" && value === false) {
        const defaults = defaultSchedule[key];
        return {
          ...prev,
          [day]: {
            enabled: false,
            start: defaults.start,
            end: defaults.end,
          },
        };
      }

      return {
        ...prev,
        [day]: { ...current, [field]: value },
      };
    });
    markChanged();
  };

  const toggleService = (id: string) => {
    // legacy local toggle (mantido para compatibilidade) — agora usamos Switch + API
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
          instagram: instagram.trim() || null,
        })
        .eq("id", currentUser.id);

      if (error) throw error;

      // Horários: mesma chave `day` canônica no UPSERT e no DELETE
      for (const day of WORK_DAY_KEYS) {
        const d = schedule[day];
        if (d?.enabled) {
          const { error: upErr } = await supabase
            .from("barber_work_hours")
            .upsert(
              {
                barber_id: currentUser.id,
                day,
                start_time: toPostgresTime(d.start),
                end_time: toPostgresTime(d.end),
              },
              { onConflict: "barber_id,day" },
            );
          if (upErr) throw upErr;
        } else {
          const { error: delErr } = await supabase
            .from("barber_work_hours")
            .delete()
            .eq("barber_id", currentUser.id)
            .eq("day", day);
          if (delErr) throw delErr;
        }
      }

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

  const loadMyServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const { services, activeServiceIds, error } = await listMyServiceToggles();
      if (error) throw new Error(error);
      setMasterServices(services);
      setActiveServiceIds(activeServiceIds);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar serviços.";
      toast.error(msg);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyServices();
  }, [loadMyServices]);

  const activeSet = useMemo(() => new Set(activeServiceIds), [activeServiceIds]);

  const handleToggleService = async (serviceId: string, next: boolean) => {
    // Optimistic UI
    setTogglingId(serviceId);
    setActiveServiceIds((prev) => {
      const set = new Set(prev);
      if (next) set.add(serviceId);
      else set.delete(serviceId);
      return Array.from(set);
    });
    try {
      const { error } = await toggleMyService(serviceId, next);
      if (error) throw new Error(error);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao atualizar.";
      toast.error(msg);
      await loadMyServices();
    } finally {
      setTogglingId(null);
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

              {/* Meus Serviços (Master + Toggle) */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Scissors className="h-5 w-5 text-primary" />
                  Meus Serviços
                </h2>
                {servicesLoading ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    Carregando serviços...
                  </div>
                ) : masterServices.length === 0 ? (
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                    Nenhum serviço master cadastrado pela barbearia ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {masterServices.map((svc) => {
                      const isOn = activeSet.has(svc.id);
                      const busy = togglingId === svc.id;
                      return (
                        <div
                          key={svc.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
                            isOn ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/20",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{svc.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              R$ {Number(svc.price).toFixed(2).replace(".", ",")} • {formatDuration(svc.duration_min)}
                            </p>
                          </div>
                          <Switch
                            checked={isOn}
                            onCheckedChange={(next) => void handleToggleService(svc.id, next)}
                            disabled={busy}
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
