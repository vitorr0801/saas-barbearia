"use client"

import { useState, useEffect, useMemo } from "react";
import { 
  User, 
  Scissors, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight, 
  Circle,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Role, useAuth } from "@/context/AuthContext";
import { supabase } from '@/lib/supabase';

type MaybeRole = Role | null;

// Helpers de utilitário
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
  const { isAuthenticated, refreshUser, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<MaybeRole>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 🛡️ REQUISITOS DE SENHA (PADRÃO TOP MUNDIAL)
  const passwordRequirements = useMemo(() => [
    { label: "6 a 72 caracteres", test: (pw: string) => pw.length >= 6 && pw.length <= 72 },
    { label: "Uma letra maiúscula", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Um número", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "Um caractere especial", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ], []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const whatsappDigits = getWhatsAppDigits(whatsapp);
  const isNameValid = name.trim().length >= 3;
  const isWhatsappValid = whatsappDigits.length === 11;
  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  
  // Validação composta da senha
  const isPasswordSecure = passwordRequirements.every(req => req.test(password));
  
  const canProceed = !!role && isNameValid && isWhatsappValid && isPasswordSecure && isEmailValid;

  const handleSendCode = async () => {
    if (!canProceed || isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Criando sua conta de elite...");
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { name: name.trim(), phone: whatsappDigits, role: role },
        },
      });
      if (error) throw error;
      toast.success("Verifique seu e-mail para ativar!", { id: toastId });
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta", { id: toastId });
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Autenticando...");
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: loginIdentifier.trim(),
        password: loginPassword,
      });
      if (error) throw error;
      if (data?.user) {
        toast.success("Acesso autorizado!", { id: toastId });
        refreshUser(); 
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast.error("E-mail ou senha inválidos", { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      
      {/* 🔙 BOTÃO DE RETORNO (UX DE ELITE) */}
      <div className="absolute top-8 left-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Voltar</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {authMode === "signup" && step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-4 rotate-3">
                <Scissors className="h-8 w-8 text-primary -rotate-45" />
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none">CRIAR CONTA</h1>
              <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-widest">Entre para o time BarberPro</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { id: "cliente" as const, label: "Sou Cliente", Icon: User, desc: "Agendar" },
                { id: "barbeiro" as const, label: "Sou Barbeiro", Icon: Scissors, desc: "Gerenciar" },
              ].map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setRole(id)}
                  className={cn(
                    "relative rounded-[1.5rem] border-2 p-5 text-left transition-all active:scale-95",
                    role === id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mb-3", role === id ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-sm font-black italic uppercase tracking-tighter">{label}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{desc}</p>
                  {role === id && <CheckCircle2 className="absolute top-4 right-4 h-4 w-4 text-primary animate-in zoom-in" />}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <FormField label="Nome Completo" valid={isNameValid}>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input disabled={isSubmitting} placeholder="Ex: Lucas Silva" value={name} onChange={(e) => setName(e.target.value)} className="pl-11 h-12 rounded-xl bg-card" />
                </div>
              </FormField>

              <FormField label="WhatsApp" valid={isWhatsappValid}>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground group-focus-within:text-primary">+55</span>
                  <Input disabled={isSubmitting} placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))} className="pl-12 h-12 rounded-xl bg-card" />
                </div>
              </FormField>

              <FormField label="E-mail" valid={isEmailValid}>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input disabled={isSubmitting} type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 rounded-xl bg-card" />
                </div>
              </FormField>

              <FormField label="Senha de Acesso">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    disabled={isSubmitting} 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Sua senha secreta" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-11 pr-11 h-12 rounded-xl bg-card" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />}
                  </button>
                </div>

                {/* 📊 FORTALEZA DE SENHA: CHECKLIST EM TEMPO REAL */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-secondary/50 rounded-2xl border border-border/50">
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
              </FormField>
            </div>

            <Button onClick={handleSendCode} disabled={!canProceed || isSubmitting} className="w-full mt-8 h-14 rounded-2xl font-black uppercase tracking-widest italic text-lg shadow-xl shadow-primary/20 transition-all active:scale-95">
              {isSubmitting ? "Processando..." : "Finalizar Cadastro"}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-8 font-bold uppercase tracking-widest">
              Já faz parte do clube? <button onClick={() => setAuthMode("login")} className="text-primary hover:underline ml-1">FAZER LOGIN</button>
            </p>
          </div>
        )}

        {authMode === "login" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none text-primary">LOGIN</h1>
              <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-widest">Acesse sua área de trabalho</p>
            </div>
            <div className="space-y-4">
              <FormField label="E-mail">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input disabled={isSubmitting} placeholder="seu@email.com" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="pl-11 h-12 rounded-xl bg-card" />
                </div>
              </FormField>
              <FormField label="Senha">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input disabled={isSubmitting} type="password" placeholder="Sua senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-11 h-12 rounded-xl bg-card" />
                </div>
              </FormField>
            </div>
            <Button onClick={handleLoginSubmit} disabled={isSubmitting} className="w-full mt-8 h-14 rounded-2xl font-black uppercase tracking-widest italic text-lg shadow-xl shadow-primary/20 active:scale-95">
              {isSubmitting ? "Autenticando..." : "Entrar no Sistema"}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-8 font-bold uppercase tracking-widest">
              Ainda não é membro? <button onClick={() => setAuthMode("signup")} className="text-primary hover:underline ml-1">CADASTRAR-SE</button>
            </p>
          </div>
        )}

        {authMode === "signup" && step === 2 && (
          <div className="animate-in zoom-in duration-500 text-center py-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">CHECK-IN!</h2>
            <p className="text-xs text-muted-foreground mt-6 mb-10 leading-relaxed max-w-[280px] mx-auto font-medium uppercase tracking-tighter">
              Enviamos um link de confirmação para o seu e-mail:<br/>
              <strong className="text-primary text-sm block mt-2">{email}</strong>
            </p>
            <Button onClick={() => setAuthMode("login")} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest italic text-lg">
              Ir para Login <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <button onClick={() => setStep(1)} className="mt-10 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mx-auto hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Corrigir Dados
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, valid, children }: { label: string; valid?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</label>
        {valid && <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in duration-300" />}
      </div>
      {children}
    </div>
  );
}