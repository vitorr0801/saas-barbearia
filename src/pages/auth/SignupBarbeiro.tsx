"use client"

import { useState, useEffect } from "react";
import { 
  Mail, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Briefcase,
  UserPlus,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// --- HELPERS ---
function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function SignupBarbeiro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, currentUser, logout } = useAuth();

  // 🕵️ LÓGICA DO CAMALEÃO (Convite)
  const isInviteFlow = searchParams.get("type") === "invite";
  const inviteToken = searchParams.get("token") || "";
  const inviteEmail = searchParams.get("email") || "";

  const [step, setStep] = useState<1 | 2>(1);
  const [authMode, setAuthMode] = useState<"signup" | "login">(isInviteFlow ? "signup" : "login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados do formulário
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState(inviteEmail); 
  const [password, setPassword] = useState("");
  
  const [loginIdentifier, setLoginIdentifier] = useState(inviteEmail);
  const [loginPassword, setLoginPassword] = useState("");

  const ROLE = "barbeiro";

  const passwordReqs = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const isPasswordValid = Object.values(passwordReqs).every(Boolean);

  // 🚀 FORÇA A SESSÃO DO CONVITE
  useEffect(() => {
    const hash = window.location.hash;
    if (isInviteFlow && hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ 
          access_token: accessToken, 
          refresh_token: refreshToken 
        }).then(({ error }) => {
          if (error) console.error("Erro ao forçar sessão:", error);
        });
      }
    }
  }, [isInviteFlow]);

  // 🛡️ GUARDIÃO DE ROTA BLINDADO
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (isInviteFlow) return;

      if (currentUser.role === 'cliente') {
        toast.error("Conta de cliente detectada. Você não tem acesso a esta área.");
        logout(); 
        return;
      }
      if (currentUser.role === 'barbeiro') {
        const target = currentUser.barbearia_id ? "/dashboard" : "/onboarding";
        navigate(target, { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, navigate, logout, isInviteFlow]);

  const handleGoogleAuth = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      localStorage.setItem("barberpro_oauth_intent", JSON.stringify({
        role: ROLE,
        isInvite: isInviteFlow,
        inviteToken: inviteToken || null
      }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback-barbeiro`,
          queryParams: { prompt: 'select_account' }
        }
      });
      if (error) throw error;
    } catch (error) {
      toast.error("Erro ao conectar com Google.");
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Autenticando...");

    try {
      localStorage.removeItem('barberpro-auth-v1'); 
      localStorage.removeItem('supabase.auth.token'); 

      const loginPromise = supabase.auth.signInWithPassword({
        email: loginIdentifier.trim(),
        password: loginPassword,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tempo limite excedido. O servidor não respondeu.")), 15000)
      );

      const { error } = await Promise.race([loginPromise, timeoutPromise]);

      if (error) {
        toast.error(error.message, { id: toastId });
        setIsSubmitting(false); 
      } else {
        toast.success("Credenciais aceitas! Entrando...", { id: toastId });
      }
    } catch (error) {
      console.error("Erro Crítico de Login:", error);
      toast.error(error instanceof Error ? error.message : "Erro de conexão.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async () => {
    if (isSubmitting) return;

    if (!name.trim() || !password || !email.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos mínimos de segurança.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(isInviteFlow ? "Validando acesso na equipe..." : "Criando sua conta...");
    const whatsappDigits = whatsapp ? whatsapp.replace(/\D/g, "") : null;

    try {
      if (isInviteFlow) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Sessão do convite não identificada. Por favor, clique no link do e-mail novamente.");
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
          data: {
            name: name.trim(),
            phone: whatsappDigits,
            role: ROLE,
            invite_token: inviteToken || null
          }
        });

        if (updateError) throw updateError;

        toast.success("Acesso configurado! Entrando no sistema...", { id: toastId });
        
        localStorage.setItem("barberpro_oauth_intent", JSON.stringify({
          role: ROLE,
          isInvite: true,
          inviteToken: inviteToken || null
        }));
        
        window.location.replace("/auth/callback-barbeiro");

      } else {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: { 
            data: { name: name.trim(), phone: whatsappDigits, role: ROLE },
            emailRedirectTo: `${window.location.origin}/auth/callback-barbeiro`
          },
        });

        if (error) throw error;

        if (data.user && data.user.identities?.length === 0) {
          toast.error("Este e-mail já está registrado. Faça login para continuar.", { id: toastId });
          setAuthMode("login");
          setIsSubmitting(false);
          return;
        }

        toast.success("Sucesso! Verifique seu e-mail para ativar a conta.", { id: toastId });
        setStep(2);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro inesperado.", { id: toastId });
      setIsSubmitting(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${met ? "text-emerald-500" : "text-muted-foreground/50"}`}>
      {met ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c12] flex flex-col items-center justify-center p-6">
      
      <div className="absolute top-8 left-8">
        {/* 🚀 TIER-1 FIX: Botão Voltar Inteligente e Contextual */}
        <button 
          onClick={() => {
            if (authMode === "signup" && !isInviteFlow) {
              setAuthMode("login");
              setPassword("");
              setLoginPassword("");
            } else {
              navigate("/");
            }
          }} 
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {authMode === "signup" && !isInviteFlow ? "Voltar" : "Início"}
          </span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-sm">
            {isInviteFlow ? <UserPlus className="h-8 w-8 text-primary" /> : <Briefcase className="h-8 w-8 text-primary" />}
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            {isInviteFlow ? "Colaborador" : (authMode === "login" ? "Entrar no Portal" : "Portal Parceiro")}
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
            {isInviteFlow ? "Crie sua conta na equipe" : "Gestão Profissional BarberPro"}
          </p>
        </div>

        {step === 1 ? (
          <div className="bg-[#11141d] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            
            <Button onClick={handleGoogleAuth} disabled={isSubmitting} variant="outline" className="w-full h-14 rounded-2xl font-bold border-white/10 hover:bg-white/5 flex items-center justify-center gap-3 transition-all">
              <GoogleIcon />
              <span className="text-sm">Continuar com Google</span>
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest">
                <span className="bg-[#11141d] px-4 text-muted-foreground">
                  {authMode === "login" ? "Ou e-mail" : "Ou credenciais"}
                </span>
              </div>
            </div>

            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {authMode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground pl-1">
                      Seu Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="text"
                      placeholder="Ex: João Silva" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      maxLength={100}
                      autoCapitalize="words"
                      autoComplete="name"
                      required
                      className="h-12 rounded-xl bg-white/5 border-none placeholder:text-muted-foreground/40 focus-visible:ring-primary" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground pl-1 flex justify-between">
                      <span>WhatsApp Pessoal</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Opcional</span>
                    </label>
                    <Input 
                      type="tel"
                      inputMode="numeric"
                      placeholder="(00) 00000-0000" 
                      value={whatsapp} 
                      onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))} 
                      maxLength={15}
                      autoComplete="tel"
                      className="h-12 rounded-xl bg-white/5 border-none placeholder:text-muted-foreground/40" 
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground pl-1">
                  E-mail profissional {authMode === "signup" && <span className="text-red-500">*</span>}
                </label>
                <Input 
                  type="email"
                  inputMode="email"
                  placeholder="contato@exemplo.com" 
                  value={authMode === "login" ? loginIdentifier : email} 
                  onChange={(e) => authMode === "login" ? setLoginIdentifier(e.target.value) : setEmail(e.target.value)} 
                  disabled={isInviteFlow && authMode === "signup" && email.length > 0}
                  maxLength={255}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete={authMode === "login" ? "username" : "email"}
                  required
                  className={cn(
                    "h-12 rounded-xl bg-white/5 border-none placeholder:text-muted-foreground/40",
                    isInviteFlow && authMode === "signup" && email.length > 0 && "opacity-50 cursor-not-allowed text-muted-foreground"
                  )}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground pl-1">
                  {authMode === "login" ? "Senha de Acesso" : "Criar Senha"} {authMode === "signup" && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    maxLength={72} 
                    placeholder="Sua senha segura" 
                    value={authMode === "login" ? loginPassword : password} 
                    onChange={(e) => authMode === "login" ? setLoginPassword(e.target.value) : setPassword(e.target.value)} 
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    required
                    className="h-12 rounded-xl bg-white/5 border-none pr-12 placeholder:text-muted-foreground/40" 
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-muted-foreground hover:text-white transition-colors" type="button">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {authMode === "signup" && password.length > 0 && (
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2 animate-in fade-in slide-in-from-top-1 mt-2">
                    <RequirementItem met={passwordReqs.length} text="Mínimo 8 caracteres" />
                    <RequirementItem met={passwordReqs.number} text="Pelo menos um número" />
                    <RequirementItem met={passwordReqs.special} text="Caractere especial (!@#$)" />
                  </div>
                )}
              </div>
            </div>

            <Button onClick={authMode === "login" ? handleLoginSubmit : handleSignupSubmit} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/20 mt-4">
              {isSubmitting ? "Sincronizando..." : (authMode === "login" ? "Acessar Painel" : "Criar Conta Rápida")}
            </Button>

            <div className="text-center">
              <button onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setPassword(""); 
                setLoginPassword("");
              }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                {authMode === "login" ? "Não tem conta? Criar agora" : "Já possuo uma conta"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-[#11141d] rounded-[2.5rem] border border-white/5">
            <Mail className="w-16 h-16 text-primary mx-auto mb-6 animate-bounce" />
            <h2 className="text-xl font-black text-white uppercase italic">Conta criada!</h2>
            <p className="text-xs text-muted-foreground mt-4 mb-8">Abra sua caixa de entrada e clique no link de ativação para entrar na plataforma.</p>
            <Button onClick={() => setStep(1)} variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5">Voltar ao Início</Button>
          </div>
        )}
      </div>
    </div>
  );
}