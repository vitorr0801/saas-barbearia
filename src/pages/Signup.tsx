"use client"

import { useState, useEffect } from "react";
import { User, Scissors, Eye, EyeOff, Mail, Lock, CheckCircle2, ChevronLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Role, useAuth } from "@/context/AuthContext";
import { supabase } from '@/lib/supabase';

type MaybeRole = Role | null;

// Helper: Formatação de WhatsApp
function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getWhatsAppDigits(formatted: string) {
  return formatted.replace(/\D/g, "");
}

export default function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser, isLoading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<MaybeRole>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /**
   * 🛡️ 1. PROTEÇÃO DE ACESSO
   * Se o usuário já está logado, ele não deve conseguir ver esta página.
   * Redirecionamos ele automaticamente para a raiz.
   */
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("🛡️ [Signup] Usuário já autenticado, redirecionando para Home...");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const whatsappDigits = getWhatsAppDigits(whatsapp);
  const isNameValid = name.trim().length >= 3;
  const isWhatsappValid = whatsappDigits.length === 11;
  const isPasswordValid = password.length >= 6;
  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  const canProceed = !!role && isNameValid && isWhatsappValid && isPasswordValid && isEmailValid;

  /**
   * 📡 CADASTRO (SIGN UP)
   */
  const handleSendCode = async () => {
    if (!canProceed) return;
    const toastId = toast.loading("Criando sua conta...");

    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
            phone: whatsappDigits,
            role: role,
          },
        },
      });

      if (error) throw error;

      toast.success("Verifique seu e-mail para ativar a conta!", { id: toastId });
      setStep(2);
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  /**
   * 🔑 LOGIN (SIGN IN) - BARREIRA DE SINCRONIA
   * O segredo está no 'await refreshUser()'.
   */
  const handleLoginSubmit = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const toastId = toast.loading("Autenticando...");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginIdentifier,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!", { id: toastId });

      /**
       * 🚀 O PULO DO GATO:
       * Não navegamos imediatamente. Esperamos o AuthContext buscar o perfil no banco.
       * Isso garante que quando cairmos no '/', o role já existe.
       */
      await refreshUser(); 
      
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error("E-mail ou senha inválidos", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {authMode === "signup" && step === 1 && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Scissors className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tighter uppercase">BARBERPRO</h1>
              <p className="text-sm text-muted-foreground mt-1">Crie sua conta em segundos</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: "cliente" as const, label: "Sou Cliente", Icon: User, desc: "Agendar" },
                { id: "barbeiro" as const, label: "Sou Barbeiro", Icon: Scissors, desc: "Gerenciar" },
              ].map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all active:scale-95",
                    role === id ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mb-3", role === id ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{desc}</p>
                  {role === id && <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <FormField label="Nome Completo" valid={isNameValid}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nome e sobrenome" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                </div>
              </FormField>

              <FormField label="WhatsApp" valid={isWhatsappValid}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">+55</span>
                  <Input placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))} className="pl-12" />
                </div>
              </FormField>

              <FormField label="E-mail" valid={isEmailValid}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                </div>
              </FormField>

              <FormField label="Senha" valid={isPasswordValid}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </FormField>
            </div>

            <Button onClick={handleSendCode} disabled={!canProceed} className="w-full mt-6 h-12 font-bold uppercase tracking-widest">
              Criar Conta
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Já possui uma conta? <button onClick={() => setAuthMode("login")} className="text-primary font-bold hover:underline">ENTRAR</button>
            </p>
          </div>
        )}

        {authMode === "login" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground tracking-tighter uppercase">Bem-vindo de volta</h1>
              <p className="text-sm text-muted-foreground mt-1">Acesse sua área restrita</p>
            </div>

            <div className="space-y-4">
              <FormField label="E-mail">
                <Input placeholder="seu@email.com" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} />
              </FormField>
              <FormField label="Senha">
                <Input type="password" placeholder="Sua senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </FormField>
            </div>

            <Button onClick={handleLoginSubmit} className="w-full mt-6 h-12 font-bold uppercase tracking-widest">
              Acessar Sistema
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Ainda não é membro? <button onClick={() => setAuthMode("signup")} className="text-primary font-bold hover:underline">CADASTRAR</button>
            </p>
          </div>
        )}

        {authMode === "signup" && step === 2 && (
          <div className="animate-in zoom-in duration-500 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tighter">QUASE LÁ!</h2>
            <p className="text-sm text-muted-foreground mt-4 mb-8">
              Enviamos um link de confirmação para:<br/>
              <strong className="text-foreground">{email}</strong>
            </p>
            <Button onClick={() => setAuthMode("login")} className="w-full h-12 font-bold uppercase tracking-widest">
              Ir para Login <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <button onClick={() => setStep(1)} className="mt-8 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mx-auto hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" /> Editar dados
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, valid, children }: { label: string; valid?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</label>
        {valid && <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-in zoom-in" />}
      </div>
      {children}
    </div>
  );
}