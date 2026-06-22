"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Header } from "@/components/Header"
import { ClientProfileHeader } from "@/components/profile/ClientProfileHeader"
import { ClientPersonalInfo } from "@/components/profile/ClientPersonalInfo"
import { SaveBar } from "@/components/profile/SaveBar"
import { Button } from "@/components/ui/button"
import { 
  ShieldCheck, Lock, X, Key, AlertTriangle, Fingerprint, 
  CheckCircle2, Circle, Trash2, UserX, Info 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  whatsapp: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => value.length === 11, {
    message: "WhatsApp deve conter 11 digitos.",
  }),
  cpf: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 0 || value.length === 11, {
      message: "CPF deve conter 11 digitos.",
    }),
})

export default function ClientProfile() {
  const { currentUser, isLoading, refreshUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🔑 ESTADOS DE SENHA
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 🛡️ ESTADOS DE EXCLUSÃO (LGPD)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [data, setData] = useState({
    name: "",
    whatsapp: "",
    cpf: "",
    email: "",
  });

  useEffect(() => {
    if (currentUser) {
      setData({
        name: currentUser.name || "",
        whatsapp: currentUser.phone || "",
        cpf: currentUser.cpf || "",
        email: currentUser.email || "",
      });
    }
  }, [currentUser]);

  const passwordRequirements = [
    { label: "Mínimo 6 e máximo 72 caracteres", test: (pw: string) => pw.length >= 6 && pw.length <= 72 },
    { label: "Pelo menos uma letra maiúscula", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Pelo menos um número", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "Pelo menos um caractere especial (!@#$%^&*)", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ];

  // 🎯 VALIDAÇÃO REATIVA: Para habilitar o botão de exclusão
  const isPhraseCorrect = deleteConfirmationText.trim().toUpperCase() === "EXCLUIR MINHA CONTA";
  const canDelete = isPhraseCorrect && deletePassword.length > 0 && !isDeletingAccount;

  const handleFieldChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Dados invalidos.");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Salvando alterações...");
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: parsed.data.name,
          phone: parsed.data.whatsapp,
          cpf: parsed.data.cpf || null,
        })
        .eq('id', currentUser.id);
      if (error) throw error;
      await refreshUser();
      toast.success("Perfil atualizado!", { id: toastId });
      setHasChanges(false);
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar dados", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    for (const req of passwordRequirements) {
      if (!req.test(newPassword)) return toast.error(`Senha Inválida: ${req.label}`);
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

      toast.success("Segurança atualizada! 🔒", { id: toastId });
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar senha", { id: toastId });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isPhraseCorrect) {
      return toast.error("A frase de confirmação está incorreta.");
    }

    setIsDeletingAccount(true);
    const toastId = toast.loading("Processando exclusão definitiva...");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser?.email as string,
        password: deletePassword,
      });

      if (authError) throw new Error("A senha fornecida está incorreta.");

      const { error: rpcError } = await supabase.rpc('delete_user_data_lgpd');
      if (rpcError) throw rpcError;

      toast.success("Sua conta e dados pessoais foram removidos.", { id: toastId });
      await logout();
      window.location.href = "/";
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir conta", { id: toastId });
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container pt-28 pb-24 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="px-4 mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">Meu Perfil</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2">Gestão de conta BarberPro</p>
        </header>

        <div className="px-4 space-y-6">
          <ClientProfileHeader name={data.name} memberSince="Membro BarberPro" isEditing={isEditing} onToggleEdit={() => setIsEditing(!isEditing)} />
          <ClientPersonalInfo isEditing={isEditing} data={data} onChange={handleFieldChange} />

          {/* SEÇÃO SEGURANÇA */}
          <section className="bg-card border border-border p-6 rounded-[2rem] space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tight">Segurança</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Proteção da sua conta</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)} className="w-full h-12 rounded-xl border-dashed border-primary/30 font-bold uppercase italic text-xs gap-2 hover:bg-primary/5 transition-all active:scale-[0.98]">
              <Key className="w-4 h-4 text-primary" /> Alterar Senha de Acesso
            </Button>
          </section>

          {/* ZONA DE PERIGO */}
          <section className="p-6 rounded-[2rem] border border-destructive/20 bg-destructive/5 space-y-4 mt-12 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive"><AlertTriangle className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tight text-destructive">Zona de Perigo</h3>
                <p className="text-[10px] text-destructive/60 font-bold uppercase tracking-widest">Ações irreversíveis</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(true)} className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 font-bold uppercase italic text-xs gap-2">
              <Trash2 className="w-4 h-4" /> Solicitar Exclusão de Dados
            </Button>
          </section>
        </div>

        <SaveBar visible={isEditing && hasChanges} onSave={handleSave} isLoading={isSaving} />
      </main>

      {/* MODAL DE TROCA DE SENHA */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isUpdatingPassword && setIsPasswordModalOpen(false)} />
          <div className="relative bg-card border border-border p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner"><Fingerprint className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Trocar Senha</h3>

              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-2">Senha Atual</label>
                  <input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium focus:border-primary/50 transition-all" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-primary ml-2">Nova Senha</label>
                  <input type="password" placeholder="Digite a nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium focus:border-primary/50 transition-all" />
                </div>

                <div className="grid grid-cols-1 gap-2 p-3 bg-secondary/30 rounded-2xl border border-border/50">
                  {passwordRequirements.map((req, index) => {
                    const isMet = req.test(newPassword);
                    return (
                      <div key={index} className={cn("flex items-center gap-2 text-[9px] font-bold uppercase transition-colors", isMet ? "text-emerald-500" : "text-muted-foreground/50")}>
                        {isMet ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {req.label}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-2">Confirmar Nova Senha</label>
                  <input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium focus:border-primary/50 transition-all" />
                </div>
              </div>

              <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword} className="w-full h-14 rounded-2xl font-black uppercase italic text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                {isUpdatingPassword ? "Validando..." : "Confirmar Alteração"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ MODAL DE EXCLUSÃO DE CONTA (DANGER ZONE) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => !isDeletingAccount && setIsDeleteModalOpen(false)} />
          <div className="relative bg-card border border-destructive/30 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto animate-pulse"><UserX className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-destructive">Confirmar Exclusão</h3>
              
              <div className="bg-secondary/50 p-4 rounded-2xl text-left border border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    De acordo com a <b>LGPD</b>, seus dados pessoais serão removidos permanentemente. Históricos de agendamentos serão anonimizados para métricas do barbeiro.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-2">Sua Senha</label>
                  <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none focus:border-destructive/40 transition-all" placeholder="••••••••" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-2">
                    <label className="text-[9px] font-black uppercase text-destructive">Digite: <span className="opacity-60 italic">EXCLUIR MINHA CONTA</span></label>
                    {isPhraseCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-in zoom-in" />}
                  </div>
                  <input 
                    type="text" 
                    value={deleteConfirmationText} 
                    onChange={(e) => setDeleteConfirmationText(e.target.value)} 
                    className={cn(
                      "w-full h-12 bg-secondary border rounded-xl px-5 text-sm outline-none font-bold uppercase transition-all",
                      isPhraseCorrect ? "border-emerald-500/50 text-emerald-500" : "border-border focus:border-destructive/40"
                    )} 
                    placeholder="Escreva aqui..." 
                  />
                </div>
              </div>

              <Button 
                onClick={handleDeleteAccount} 
                disabled={!canDelete} 
                variant="destructive" 
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase italic text-lg shadow-lg active:scale-95 transition-all",
                  canDelete ? "opacity-100 shadow-destructive/20" : "opacity-30 grayscale"
                )}
              >
                {isDeletingAccount ? "Processando..." : "Confirmar Exclusão"}
              </Button>

              <button 
                onClick={() => setIsDeleteModalOpen(false)}
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