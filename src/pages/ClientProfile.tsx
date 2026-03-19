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
import { ShieldCheck, Lock, X, Key, AlertTriangle, Fingerprint, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ClientProfile() {
  const { currentUser, isLoading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
        cpf: "", 
        email: currentUser.email || "",
      });
    }
  }, [currentUser]);

  /**
   * 🛡️ VALIDADOR DE REQUISITOS (PADRÃO TOP MUNDIAL)
   */
  const passwordRequirements = [
    { label: "Mínimo 6 e máximo 72 caracteres", test: (pw: string) => pw.length >= 6 && pw.length <= 72 },
    { label: "Pelo menos uma letra maiúscula", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Pelo menos um número", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "Pelo menos um caractere especial (!@#$%^&*)", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ];

  const handleFieldChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    const toastId = toast.loading("Salvando alterações...");
    try {
      const { error } = await supabase.from('profiles').update({ name: data.name, phone: data.whatsapp.replace(/\D/g, "") }).eq('id', currentUser.id);
      if (error) throw error;
      await refreshUser();
      toast.success("Perfil atualizado!", { id: toastId });
      setHasChanges(false);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar dados", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    // 1. Validação de Requisitos uma a uma
    for (const req of passwordRequirements) {
      if (!req.test(newPassword)) {
        return toast.error(`Senha Inválida: ${req.label}`);
      }
    }

    if (newPassword !== confirmPassword) {
      return toast.error("As novas senhas não coincidem.");
    }

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
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha", { id: toastId });
    } finally {
      setIsUpdatingPassword(false);
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

          <section className="bg-card border border-border p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tight">Segurança</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Proteção da sua conta</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)} className="w-full h-12 rounded-xl border-dashed border-primary/30 font-bold uppercase italic text-xs gap-2">
              <Key className="w-4 h-4 text-primary" /> Alterar Senha de Acesso
            </Button>
          </section>
        </div>

        <SaveBar visible={isEditing && hasChanges} onSave={handleSave} isLoading={isSaving} />
      </main>

      {/* 🛡️ MODAL DE TROCA DE SENHA COM FEEDBACK VISUAL EM TEMPO REAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isUpdatingPassword && setIsPasswordModalOpen(false)} />
          <div className="relative bg-card border border-border p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner"><Fingerprint className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Trocar Senha</h3>

              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-2">Senha Atual</label>
                  <input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium" />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-primary ml-2">Nova Senha</label>
                  <input type="password" placeholder="Digite a nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium" />
                </div>

                {/* 📊 INDICADOR DE REQUISITOS EM TEMPO REAL */}
                <div className="grid grid-cols-1 gap-2 p-3 bg-secondary/30 rounded-2xl text-left border border-border/50">
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

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-2">Confirmar Nova Senha</label>
                  <input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-12 bg-secondary border border-border rounded-xl px-5 text-sm outline-none font-medium" />
                </div>
              </div>

              <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword} className="w-full h-14 rounded-2xl font-black uppercase italic text-lg shadow-lg shadow-primary/20 active:scale-95">
                {isUpdatingPassword ? "Validando..." : "Confirmar Alteração"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}