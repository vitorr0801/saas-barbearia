import { useState } from "react";
import { User, Scissors, Eye, EyeOff, Phone, Mail, Lock, CheckCircle2, ChevronLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Role, AuthUser, useAuth } from "@/context/AuthContext";

type MaybeRole = Role | null;

const USERS_STORAGE_KEY = "barberpro_users";

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
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<MaybeRole>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<MaybeRole>(null);

  const whatsappDigits = getWhatsAppDigits(whatsapp);
  const isNameValid = name.trim().length >= 3;
  const isWhatsappValid = whatsappDigits.length === 11;
  const isPasswordValid = password.length >= 6;
  const canProceed = !!role && isNameValid && isWhatsappValid && isPasswordValid;

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(59);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = () => {
    if (!canProceed) return;
    setStep(2);
    startCountdown();
    toast.success("Código enviado para seu WhatsApp!");
  };

  const handleResend = () => {
    if (!canResend) return;
    startCountdown();
    toast.success("Código reenviado!");
  };

  const handleGoToLogin = () => {
    setAuthMode("login");
    setStep(1);
  };

  const handleBackToSignup = () => {
    setAuthMode("signup");
    setStep(1);
  };

  const handleValidate = () => {
    if (otp.length < 6) {
      toast.error("Digite o código completo");
      return;
    }

    if (otp !== "123456") {
      toast.error("Código inválido. Use 123456 para testes.");
      return;
    }

    const phone = whatsappDigits;
    if (phone.length !== 11) {
      toast.error("WhatsApp inválido");
      return;
    }

    // Fluxo de criação de conta (signup) com OTP
    let finalUser: AuthUser = {
      name: name || "Nome",
      phone,
      role: role || "barbeiro",
    };

    window.localStorage.setItem("user", JSON.stringify(finalUser));
    login(finalUser);

    // Cliente cai no fluxo de agendamento, barbeiro no dashboard
    if (finalUser.role === "cliente") {
      navigate("/agendar", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleLoginSubmit = () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      toast.error("Preencha login e senha");
      return;
    }

    if (!loginRole) {
      toast.error("Selecione se você é cliente ou barbeiro");
      return;
    }

    const mockUser: AuthUser = {
      name: "Vítor",
      phone: loginIdentifier,
      role: loginRole,
    };

    window.localStorage.setItem("user", JSON.stringify(mockUser));
    login(mockUser);

    // Cliente cai no fluxo de agendamento, barbeiro no dashboard
    if (mockUser.role === "cliente") {
      navigate("/agendar", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const maskedNumber = whatsappDigits
    ? `+55 (${whatsappDigits.slice(0, 2)}) •••••-${whatsappDigits.slice(7)}`
    : "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Step 1 - Signup */}
        {authMode === "signup" && (
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              step === 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full absolute pointer-events-none"
            )}
          >
            {/* Logo / Title */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Scissors className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Criar sua conta</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Entre para a melhor plataforma de barbearias
              </p>
            </div>

            {/* Role Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {([
                { id: "cliente" as const, label: "Sou Cliente", Icon: User, desc: "Agendar serviços" },
                { id: "barbeiro" as const, label: "Sou Barbeiro", Icon: Scissors, desc: "Gerenciar negócio" },
              ]).map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all duration-300",
                    "bg-card hover:border-primary/40",
                    role === id
                      ? "border-primary glow-amber-subtle"
                      : "border-border"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                    role === id ? "bg-primary/20" : "bg-secondary"
                  )}>
                    <Icon className={cn("h-5 w-5", role === id ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  {role === id && (
                    <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary animate-scale-in" />
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Nome */}
              <FormField label="Nome Completo" valid={isNameValid && name.length > 0}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  />
                </div>
              </FormField>

              {/* WhatsApp */}
              <FormField label="WhatsApp" valid={isWhatsappValid}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">🇧🇷 +55</span>
                  </div>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                    className="pl-[5.5rem] bg-secondary border-border focus:border-primary focus:ring-primary/30"
                    inputMode="numeric"
                  />
                </div>
              </FormField>

              {/* E-mail */}
              <FormField label="E-mail" optional>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  />
                </div>
              </FormField>

              {/* Senha */}
              <FormField label="Senha" valid={isPasswordValid && password.length > 0}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
            </div>

            {/* CTA */}
            <Button
              onClick={handleSendCode}
              disabled={!canProceed}
              className="w-full mt-6 h-12 text-base font-semibold btn-primary-glow disabled:opacity-50 disabled:shadow-none"
            >
              <Phone className="h-4 w-4 mr-2" />
              Enviar Código via WhatsApp
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={handleGoToLogin}
                className="text-primary font-medium hover:underline"
              >
                Entrar
              </button>
            </p>
          </div>
        )}

        {/* Step 1 - Login */}
        {authMode === "login" && (
          <div className="transition-all duration-500 ease-out opacity-100 translate-x-0">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acesse sua conta com login e senha
              </p>
            </div>

            {/* Role Selector (login) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {([
                { id: "cliente" as const, label: "Sou Cliente", Icon: User, desc: "Ver meus agendamentos" },
                { id: "barbeiro" as const, label: "Sou Barbeiro", Icon: Scissors, desc: "Gerenciar barbearia" },
              ]).map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLoginRole(id)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all duration-300",
                    "bg-card hover:border-primary/40",
                    loginRole === id
                      ? "border-primary glow-amber-subtle"
                      : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                      loginRole === id ? "bg-primary/20" : "bg-secondary"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        loginRole === id ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  {loginRole === id && (
                    <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary animate-scale-in" />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <FormField label="WhatsApp ou E-mail">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Seu WhatsApp ou e-mail"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  />
                </div>
              </FormField>

              <FormField label="Senha">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
            </div>

            <Button
              onClick={handleLoginSubmit}
              className="w-full mt-6 h-12 text-base font-semibold btn-primary-glow disabled:opacity-50 disabled:shadow-none"
            >
              Entrar
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={handleBackToSignup}
                className="text-primary font-medium hover:underline"
              >
                Criar conta
              </button>
            </p>
          </div>
        )}

        {/* Step 2: OTP (apenas para signup) */}
        {authMode === "signup" && (
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              step === 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full absolute pointer-events-none"
            )}
          >
            <div className="text-center">
              {/* Animated icon */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-amber-subtle">
                <Phone className="h-7 w-7 text-primary" />
              </div>

              <h2 className="text-xl font-bold text-foreground">Verifique seu WhatsApp</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
                Enviamos um código de 6 dígitos para{" "}
                <span className="text-foreground font-medium">{maskedNumber}</span>
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center mt-8">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className={cn(
                        "w-12 h-14 text-lg font-semibold rounded-lg border-2 bg-secondary",
                        "focus:border-primary focus:ring-2 focus:ring-primary/30",
                        otp[i] ? "border-primary/50 text-foreground" : "border-border text-muted-foreground"
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Resend / Edit */}
            <div className="text-center mt-6 space-y-2">
              <button
                onClick={handleResend}
                disabled={!canResend}
                className={cn(
                  "text-sm transition-colors",
                  canResend ? "text-primary hover:underline" : "text-muted-foreground"
                )}
              >
                {canResend
                  ? "Reenviar código"
                  : `Reenviar código em 00:${String(countdown).padStart(2, "0")}`}
              </button>
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Voltar e editar número
                </button>
              </div>
            </div>

            {/* Validate */}
            <Button
              onClick={handleValidate}
              disabled={otp.length < 6}
              className="w-full mt-8 h-12 text-base font-semibold btn-primary-glow disabled:opacity-50 disabled:shadow-none"
            >
              Validar e Começar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Small helper component */
function FormField({
  label,
  optional,
  valid,
  children,
}: {
  label: string;
  optional?: boolean;
  valid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-1">
          {optional && (
            <span className="text-xs text-muted-foreground/60">Opcional</span>
          )}
          {valid && (
            <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))] animate-scale-in" />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
