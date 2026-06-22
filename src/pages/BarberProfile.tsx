"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle, X, Key, AlertTriangle, Fingerprint, CheckCircle2, Circle, Trash2, UserX, Info, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarberProfileHeader } from "@/components/profile/BarberProfileHeader";
import { BarberBio } from "@/components/profile/BarberBio";
import { BarberSocialLinks } from "@/components/profile/BarberSocialLinks";
import { ClientPersonalInfo } from "@/components/profile/ClientPersonalInfo";
import { SaveBar } from "@/components/profile/SaveBar";
import { Button } from "@/components/ui/button";
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

// Requisitos de senha (mesmo padrão do cliente)
const passwordRequirements = [
  { label: "Mínimo 6 e máximo 72 caracteres", test: (pw: string) => pw.length >= 6 && pw.length <= 72 },
  { label: "Pelo menos uma letra maiúscula",   test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Pelo menos um número",              test: (pw: string) => /[0-9]/.test(pw) },
  { label: "Pelo menos um caractere especial (!@#$%^&*)", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

export default function BarberProfile() {
  const navigate = useNavigate();
  const { currentUser, refreshUser, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [accountData, setAccountData] = useState({ name: "", whatsapp: "", cpf: "", email: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");

  // ── Estados: Trocar Senha ──────────────────────────────────────────────────
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword]         = useState("");
  const [newPassword, setNewPassword]                 = useState("");
  const [confirmPassword, setConfirmPassword]         = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword]   = useState(false);

  // ── Estados: Desvinculação (Zona de Perigo) ────────────────────────────────
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnectConfirmText, setDisconnectConfirmText] = useState("");
  const [isDisconnecting, setIsDisconnecting]             = useState(false);

  const isPhraseCorrect = disconnectConfirmText.trim().toUpperCase() === "SAIR DA EQUIPE";

  const loadProfileFromSupabase = useCallback(async () => {
    setProfileLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { toast.error("Sessão inválida."); return; }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, phone, cpf, email, instagram, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) console.warn("[Profile] Erro ao buscar perfil:", profileError);

      let fallbackName = "";
      if (user.user_metadata?.full_name || user.user_metadata?.name) {
        fallbackName = user.user_metadata.full_name || user.user_metadata.name;
      } else if (user.email) {
        const prefix = user.email.split("@")[0];
        fallbackName = prefix.split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }

      setAccountData({
        name:     profileData?.name     || fallbackName,
        whatsapp: formatWhatsApp(profileData?.phone ?? ""),
        cpf:      profileData?.cpf      ?? "",
        email:    profileData?.email    ?? user.email ?? "",
      });
      setAvatarUrl(profileData?.avatar_url ?? "");
      setInstagram(profileData?.instagram  ?? "");
    } catch (err) {
      console.error("[Profile] Erro crítico:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfileFromSupabase(); }, [loadProfileFromSupabase]);

  const markChanged = () => setHasChanges(true);

  const handleAccountFieldChange = (field: string, value: string) => {
    setAccountData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    const parsed = profileSchema.safeParse(accountData);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos."); return; }

    setIsSaving(true);
    const toastId = toast.loading("Salvando perfil...");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: parsed.data.name, phone: parsed.data.whatsapp, cpf: parsed.data.cpf || null, instagram: instagram.trim() || null })
        .eq("id", currentUser.id);
      if (error) throw new Error("Falha ao salvar dados de cadastro.");
      await refreshUser();
      toast.success("Perfil atualizado com sucesso!", { id: toastId });
      setHasChanges(false);
      setIsEditing(false);
      await loadProfileFromSupabase();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado ao salvar.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Trocar Senha ─────────────────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    for (const req of passwordRequirements) {
      if (!req.test(newPassword)) return toast.error(`Senha inválida: ${req.label}`);
    }
    if (newPassword !== confirmPassword) return toast.error("As novas senhas não coincidem.");

    setIsUpdatingPassword(true);
    const toastId = toast.loading("Verificando identidade...");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser?.email as string,
        password: currentPassword,
      });
      if (signInError) throw new Error("A senha atual está incorreta.");

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast.success("Senha atualizada com segurança! 🔒", { id: toastId });
      setIsPasswordModalOpen(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar senha", { id: toastId });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ── Sair da Equipe ────────────────────────────────────────────────────────
  const handleDisconnectAccount = async () => {
    if (!isPhraseCorrect) return toast.error("Digite a frase de confirmação corretamente.");
    if (!currentUser?.id)  return;

    setIsDisconnecting(true);
    const toastId = toast.loading("Desvinculando conta...");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ barbearia_id: null, provides_services: false })
        .eq("id", currentUser.id);
      if (error) throw error;
      toast.success("Você saiu da equipe. O acesso será encerrado.", { id: toastId });
      setTimeout(async () => { await signOut(); navigate("/"); }, 1500);
    } catch {
      toast.error("Erro ao desvincular conta.", { id: toastId });
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto space-y-8 overflow-x-hidden pb-10">

      <header className="flex flex-col gap-6 animate-in fade-in duration-500 pt-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <UserCircle className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meu Espaço</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Perfil <span className="text-primary">Profissional</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Gerencie seus dados e configurações de segurança.
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
              avatarUrl={avatarUrl}
              rating={5}
              reviewCount={0}
              isEditing={isEditing}
              onToggleEdit={() => { setIsEditing(!isEditing); if (isEditing) setHasChanges(false); }}
              onAvatarUpdated={setAvatarUrl}
            />

            <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-xl p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Dados Cadastrais
              </p>
              <ClientPersonalInfo isEditing={isEditing} data={accountData} onChange={handleAccountFieldChange} />
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

            <BarberSocialLinks
              isEditing={isEditing}
              instagram={instagram}
              onInstagramChange={(v) => { setInstagram(v); markChanged(); }}
            />

            {/* ── SEGURANÇA ─────────────────────────────────────────────── */}
            <section className="bg-card border border-border p-6 rounded-[2rem] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tight">Segurança</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Proteção da sua conta</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full h-12 rounded-xl border-dashed border-primary/30 font-bold uppercase italic text-xs gap-2 hover:bg-primary/5 transition-all active:scale-[0.98]"
              >
                <Key className="w-4 h-4 text-primary" /> Alterar Senha de Acesso
              </Button>
            </section>

            {/* ── ZONA DE PERIGO ────────────────────────────────────────── */}
            <section className="p-6 rounded-[2rem] border border-destructive/20 bg-destructive/5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tight text-destructive">Zona de Perigo</h3>
                  <p className="text-[10px] text-destructive/60 font-bold uppercase tracking-widest">Ações irreversíveis</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsDisconnectModalOpen(true)}
                className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 font-bold uppercase italic text-xs gap-2"
              >
                <Trash2 className="w-4 h-4" /> Sair da Equipe
              </Button>
            </section>

          </div>
        )}
      </div>

      <SaveBar visible={isEditing && hasChanges} onSave={handleSave} isLoading={isSaving} />

      {/* ================================================================ */}
      {/* MODAL: TROCAR SENHA                                              */}
      {/* ================================================================ */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => !isUpdatingPassword && setIsPasswordModalOpen(false)}
          />
          <div className="relative bg-card border border-border p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Fingerprint className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Trocar Senha</h3>

              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-2">Senha Atual</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium focus:border-primary/50 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-primary ml-2">Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Digite a nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Checklist de requisitos */}
                <div className="grid grid-cols-1 gap-2 p-3 bg-secondary/30 rounded-2xl border border-border/50">
                  {passwordRequirements.map((req, i) => {
                    const isMet = req.test(newPassword);
                    return (
                      <div key={i} className={cn("flex items-center gap-2 text-[9px] font-bold uppercase transition-colors", isMet ? "text-emerald-500" : "text-muted-foreground/50")}>
                        {isMet ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {req.label}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <Button
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full h-14 rounded-2xl font-black uppercase italic text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {isUpdatingPassword ? "Validando..." : "Confirmar Alteração"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: SAIR DA EQUIPE (ZONA DE PERIGO)                          */}
      {/* ================================================================ */}
      {isDisconnectModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in"
            onClick={() => !isDisconnecting && setIsDisconnectModalOpen(false)}
          />
          <div className="relative bg-card border border-destructive/30 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setIsDisconnectModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <UserX className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-destructive">Sair da Equipe</h3>

              <div className="bg-secondary/50 p-4 rounded-2xl text-left border border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Ao confirmar, você perderá acesso ao painel da barbearia e sua agenda não receberá novos clientes.
                    Seus <b>dados históricos serão mantidos</b> para prestação de contas do gestor.
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[9px] font-black uppercase text-destructive">
                    Digite: <span className="opacity-60 italic">SAIR DA EQUIPE</span>
                  </label>
                  {isPhraseCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-in zoom-in" />}
                </div>
                <input
                  type="text"
                  value={disconnectConfirmText}
                  onChange={(e) => setDisconnectConfirmText(e.target.value)}
                  placeholder="Escreva aqui..."
                  className={cn(
                    "w-full h-12 bg-secondary border rounded-xl px-5 text-sm outline-none font-bold uppercase transition-all",
                    isPhraseCorrect
                      ? "border-emerald-500/50 text-emerald-500"
                      : "border-border focus:border-destructive/40"
                  )}
                />
              </div>

              <Button
                onClick={handleDisconnectAccount}
                disabled={!isPhraseCorrect || isDisconnecting}
                variant="destructive"
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase italic text-lg shadow-lg active:scale-95 transition-all",
                  isPhraseCorrect ? "opacity-100 shadow-destructive/20" : "opacity-30 grayscale"
                )}
              >
                {isDisconnecting ? "Processando..." : "Confirmar Saída"}
              </Button>

              <button
                onClick={() => setIsDisconnectModalOpen(false)}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar e Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}