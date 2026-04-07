"use client"

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Circle, 
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const isInviteAccept = location.pathname === "/atualizar-senha";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLinkError, setInviteLinkError] = useState<string | null>(null);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const error = params.get("error");
    const errorCode = params.get("error_code");

    if (error === "access_denied" || errorCode === "otp_expired") {
      setInviteLinkError(
        "Este link de convite expirou ou já foi utilizado. Por segurança, peça ao administrador da barbearia para reenviar o convite.",
      );
    }
  }, []);

  // 🛡️ REQUISITOS DE SENHA (Sincronizados com o Signup para integridade total)
  const passwordRequirements = useMemo(() => [
    { label: "6 a 72 caracteres", test: (pw: string) => pw.length >= 6 && pw.length <= 72 },
    { label: "Uma letra maiúscula", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Um número", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "Um caractere especial", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ], []);

  const isPasswordSecure = passwordRequirements.every(req => req.test(password));

  // 🛠️ FUNÇÃO DE ATUALIZAÇÃO (NÍVEL MUNDIAL)
  const handleResetPassword = async () => {
    if (!isPasswordSecure) {
      toast.error("A senha não atende aos requisitos de segurança.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Selando sua nova credencial...");

    try {
      // O Supabase identifica o usuário automaticamente pelo token no link do e-mail
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      // ✅ Marca o convite como concluído (status ativo) no perfil do usuário logado
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase.from("profiles").update({ status: "ativo" }).eq("id", user.id);
        }
      } catch {
        // best-effort: não bloquear o acesso caso falhe
      }

      toast.success("Senha atualizada com sucesso! Acesso liberado.", { id: toastId });
      
      // Pequeno delay para o usuário ler o sucesso antes de ser jogado para o login
      setTimeout(() => {
        navigate("/cadastro"); // Onde está o seu componente de Login
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Cabeçalho de Impacto */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto mb-6 rotate-6 shadow-inner">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic leading-none">
            DEFINIR SENHA
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            {isInviteAccept
              ? "Complete seu cadastro na equipe BarberPro"
              : "Sua segurança é nossa prioridade máxima"}
          </p>
        </div>

        {inviteLinkError ? (
          <div className="rounded-[2.5rem] border border-destructive/30 bg-destructive/10 p-8 shadow-2xl shadow-destructive/5 space-y-3">
            <p className="text-sm font-black uppercase tracking-widest text-destructive">
              Link inválido
            </p>
            <p className="text-sm text-destructive/90 leading-relaxed font-semibold">
              {inviteLinkError}
            </p>
            <Button
              type="button"
              onClick={() => navigate("/cadastro", { replace: true })}
              className="mt-2 w-full h-14 rounded-2xl font-black uppercase tracking-widest italic text-base shadow-none"
              variant="outline"
            >
              Ir para Login
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl shadow-primary/5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                Definir senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  disabled={isSubmitting}
                  type={showPassword ? "text" : "password"} 
                  placeholder="Digite sua senha" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="pl-11 pr-11 h-14 rounded-2xl bg-secondary/50 border-none focus-visible:ring-primary" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Checklist de Segurança (UX de Elite) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-secondary/30 rounded-3xl border border-border/50">
              {passwordRequirements.map((req, index) => {
                const isMet = req.test(password);
                return (
                  <div key={index} className={cn(
                    "flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter transition-all",
                    isMet ? "text-emerald-500" : "text-muted-foreground/40"
                  )}>
                    {isMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 opacity-20" />}
                    {req.label}
                  </div>
                );
              })}
            </div>

            <Button 
              onClick={handleResetPassword} 
              disabled={!isPasswordSecure || isSubmitting} 
              className="w-full h-16 rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Protegendo..." : (
                <>
                  Definir Senha <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}

        <p className="text-center text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">
          BarberPro Security Protocol v3.0
        </p>
      </div>
    </div>
  );
}