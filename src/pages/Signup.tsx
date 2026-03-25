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
  ArrowLeft,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const { isAuthenticated, refreshUser, isLoading: authLoading } = useAuth();

  // 🎯 CAPTURA DE CONTEXTO DA URL
  const roleParam = searchParams.get("role") as MaybeRole;
  const modeParam = searchParams.get("mode") as "signup" | "login" | null;
  
  // Trava de Segurança visual de perfil
  const isRoleLocked = roleParam === "cliente" || roleParam === "barbeiro";

  const [step, setStep] = useState<1 | 2>(1);
  
  // 🛡️ INICIALIZAÇÃO DE ESTADO
  const [authMode, setAuthMode] = useState<"signup" | "login">(
    modeParam === "signup" ? "signup" : "login"
  );
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<MaybeRole>(roleParam);
  
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 🛡️ SINCRONIZAÇÃO FORÇADA DE PERFIL
  useEffect(() => {
    if (roleParam) setRole(roleParam);
  }, [roleParam]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // 🧠 LÓGICA DO BOTÃO ULTRAINTELIGENTE V2 (Hierarquia Real)
  const handleBackAction = () => {
    if (isRecovering) {
      setIsRecovering(false);
      return;
    }
    
    // 🎯 CORREÇÃO CRÍTICA: Se o usuário veio direto para o cadastro (CTA), 
    // clicar em voltar deve SAIR e não ir para o login.
    if (authMode === "signup" && modeParam === "signup") {
      navigate(-1);
      return;
    }

    if (authMode === "signup") {
      setAuthMode("login");
      setStep(1);
      return;
    }

    // Se estiver no Login, ele realmente deseja sair do fluxo
    navigate(-1);
  };

  const passwordRequirements = useMemo(() => [
    { label: "6 a 72 caracteres", test: (pw: string) => pw.length >= 6 && pw.length <= 72 },
    { label: "Uma letra maiúscula", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "Um número", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "Um caractere especial", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ], []);

  const whatsappDigits = getWhatsAppDigits(whatsapp);
  const isNameValid = name.trim().length >= 3;
  const isWhatsappValid = whatsappDigits.length === 11;
  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  const isLoginEmailValid = /\S+@\S+\.\S+/.test(loginIdentifier.trim());
  const isPasswordSecure = passwordRequirements.every(req => req.test(password));
  
  const canProceed = !!role && isNameValid && isWhatsappValid && isPasswordSecure && isEmailValid;

  const handleRecoverPassword = async () => {
    if (!isLoginEmailValid) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Enviando link...");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginIdentifier.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Verifique seu e-mail!", { id: toastId });
      setIsRecovering(false);
    } catch (error: any) {
      toast.error("Erro ao processar.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCode = async () => {
    if (!canProceed || isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Criando sua conta...");
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { name: name.trim(), phone: whatsappDigits, role: role },
        },
      });
      if (error) throw error;
      toast.success("Sucesso! Ative seu e-mail.", { id: toastId });
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-x-hidden">
      
      {/* 🔙 BOTÃO DE RETORNO ULTRAINTELIGENTE */}
      <div className="absolute top-8 left-8">
        <button 
          onClick={handleBackAction}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
            { (isRecovering || (authMode === "signup" && modeParam !== "signup")) ? "Voltar" : "Sair" }
          </span>
        </button>
      </div>

      <div className="w-full max-w-md">
        
        {/* --- 🔑 MODO LOGIN --- */}
        {authMode === "login" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none">
                {isRecovering ? "RESGATE" : "ENTRAR"}
              </h1>
              <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-widest">
                {roleParam === 'cliente' ? "Portal do Cliente BarberPro" : "Acesso à Bancada Profissional"}
              </p>
            </div>

            <div className="space-y-4">
              <FormField label="E-mail">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input disabled={isSubmitting} placeholder="seu@email.com" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="pl-11 h-12 rounded-xl bg-card shadow-sm" />
                </div>
              </FormField>

              {!isRecovering && (
                <FormField label="Senha">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input disabled={isSubmitting} type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-11 h-12 rounded-xl bg-card shadow-sm" />
                  </div>
                  <button onClick={() => setIsRecovering(true)} className="text-[9px] font-black uppercase text-primary/60 hover:text-primary text-right w-full block mt-1">Esqueci minha senha</button>
                </FormField>
              )}
            </div>

            <Button onClick={handleLoginSubmit} disabled={isSubmitting} className="w-full mt-8 h-14 rounded-2xl font-black uppercase tracking-widest italic text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all">
              {isSubmitting ? "Autenticando..." : isRecovering ? "Enviar Resgate" : "Acessar Sistema"}
            </Button>

            <div className="text-center mt-8">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Novo por aqui? 
                <button onClick={() => { setAuthMode("signup"); setIsRecovering(false); }} className="text-primary hover:underline ml-2">CADASTRAR-SE</button>
              </p>
            </div>
          </div>
        )}

        {/* --- 📝 MODO CADASTRO --- */}
        {authMode === "signup" && step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-4 rotate-3">
                {role === 'barbeiro' ? <Scissors className="h-8 w-8 text-primary -rotate-45" /> : <User className="h-8 w-8 text-primary" />}
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none">NOVO MEMBRO</h1>
              
              {isRoleLocked && (
                <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 animate-in zoom-in">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Cadastro de {roleParam === 'cliente' ? 'Cliente' : 'Barbeiro'}
                  </span>
                </div>
              )}
            </div>
            
            {!isRoleLocked && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { id: "cliente" as const, label: "Sou Cliente", Icon: User, desc: "Agendar" },
                  { id: "barbeiro" as const, label: "Sou Barbeiro", Icon: Scissors, desc: "Gerenciar" },
                ].map(({ id, label, Icon, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={cn(
                      "relative rounded-[1.5rem] border-2 p-5 text-left transition-all",
                      role === id ? "border-primary bg-primary/5 shadow-inner" : "border-border bg-card",
                    )}
                  >
                    <Icon className={cn("h-5 w-5 mb-3", role === id ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-sm font-black italic uppercase tracking-tighter">{label}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{desc}</p>
                    {role === id && <CheckCircle2 className="absolute top-4 right-4 h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <FormField label="Nome Completo" valid={isNameValid}>
                <Input placeholder="Ex: Lucas Silva" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl bg-card shadow-sm" />
              </FormField>

              <FormField label="WhatsApp" valid={isWhatsappValid}>
                <Input placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))} className="h-12 rounded-xl bg-card shadow-sm" />
              </FormField>

              <FormField label="E-mail" valid={isEmailValid}>
                <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-card shadow-sm" />
              </FormField>

              <FormField label="Crie uma Senha">
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Min. 6 caracteres" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="h-12 rounded-xl bg-card pr-11 shadow-sm" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
            </div>

            <Button onClick={handleSendCode} disabled={!canProceed || isSubmitting} className="w-full mt-8 h-14 rounded-2xl font-black uppercase tracking-widest italic text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all">
              {isSubmitting ? "Processando..." : "Finalizar Cadastro"}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-8 font-bold uppercase tracking-widest">
              Já tem conta? <button onClick={() => setAuthMode("login")} className="text-primary hover:underline ml-1">FAZER LOGIN</button>
            </p>
          </div>
        )}

        {/* --- ✅ MODO CONFIRMAÇÃO --- */}
        {authMode === "signup" && step === 2 && (
          <div className="animate-in zoom-in duration-500 text-center py-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">SUCESSO!</h2>
            <p className="text-xs text-muted-foreground mt-6 mb-10 leading-relaxed font-medium">
              Verifique o link enviado para:<br/>
              <strong className="text-primary block mt-2 text-sm">{email}</strong>
            </p>
            <Button onClick={() => setAuthMode("login")} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest italic text-lg shadow-lg">
              Ir para Login <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
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
        {valid && <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in" />}
      </div>
      {children}
    </div>
  );
}