"use client"

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BarberLayout } from "@/components/layout/BarberLayout";

const Landing                = lazy(() => import("@/pages/Landing"));
const ClientPortal           = lazy(() => import("@/pages/ClientPortal"));
const Dashboard              = lazy(() => import("@/pages/Dashboard"));
const Agenda                 = lazy(() => import("@/pages/Agenda"));
const Financial              = lazy(() => import("@/pages/Financial"));
const Products               = lazy(() => import("@/pages/Products"));
const Servicos               = lazy(() => import("@/pages/Servicos"));
const Onboarding             = lazy(() => import("./pages/Onboarding"));
const Workstation            = lazy(() => import("./pages/Workstation"));
const ClientProfile          = lazy(() => import("./pages/ClientProfile"));
const BarberProfile          = lazy(() => import("./pages/BarberProfile"));
const BarbershopSettings     = lazy(() => import("./pages/BarbershopSettings"));
const ResetPassword          = lazy(() => import("./pages/ResetPassword"));
const NotFound               = lazy(() => import("./pages/NotFound"));
const MyAppointments         = lazy(() => import("./pages/MyAppointments"));
const Favorites              = lazy(() => import("./pages/Favorites"));
const Team                   = lazy(() => import("./pages/Team"));
const Index                  = lazy(() => import("./pages/Index"));
const Checkout               = lazy(() => import("./pages/Checkout"));
const BookingSuccess         = lazy(() => import("./pages/BookingSuccess"));
const SignupCliente          = lazy(() => import("./pages/auth/SignupCliente"));
const SignupBarbeiro         = lazy(() => import("./pages/auth/SignupBarbeiro"));
const WelcomeBarber          = lazy(() => import("./pages/auth/WelcomeBarber"));
const AuthCallback           = lazy(() => import("./pages/AuthCallback"));
const AuthCallbackBarbeiro   = lazy(() => import("./pages/AuthCallbackBarbeiro"));
const Privacidade            = lazy(() => import("./pages/legal/Privacidade"));
const TermosUso              = lazy(() => import("./pages/legal/Termos"));
const FAQ                    = lazy(() => import("./pages/legal/FAQ"));

// ─── Loading Screen ──────────────────────────────────────────────────────────

const LoadingScreen = ({ message = "Sincronizando..." }: { message?: string }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0c12]">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="mt-6 text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">
      {message}
    </p>
  </div>
);

// ─── Protected Route (RBAC) ───────────────────────────────────────────────────

function ProtectedRoute({
  children,
  allowedRoles,
  requiredModule,
}: {
  children: JSX.Element;
  allowedRoles?: Array<"cliente" | "barbeiro">;
  requiredModule?: "finance" | "team" | "products" | "settings";
}) {
  const { isAuthenticated, role, isLoading, currentUser } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen message="Validando acesso..." />;

  if (!isAuthenticated) {
    const isBarberRoute = ["dashboard","onboarding","financeiro","equipe","produtos","servicos","agendamentos"]
      .some(path => location.pathname.includes(path));
    return <Navigate to={isBarberRoute ? "/login-barbeiro" : "/login-cliente"} replace state={{ from: location }} />;
  }

  if (!role) return <LoadingScreen message="Sincronizando perfil..." />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredModule && role === "barbeiro") {
    const isOwner    = Boolean(currentUser?.is_admin);
    const userJob    = (currentUser?.job_title || "barbeiro").toLowerCase().trim();
    const isManager  = userJob === "gerente";
    const isSecretary = userJob === "secretária" || userJob === "secretaria";

    const accessMap: Record<string, boolean> = {
      finance:  isOwner,
      team:     isOwner || isManager,
      settings: isOwner || isManager,
      products: isOwner || isManager || isSecretary,
    };

    if (!accessMap[requiredModule]) return <Navigate to="/dashboard" replace />;
  }

  const isDonoSemBarbearia = role === "barbeiro" && !currentUser?.barbearia_id && currentUser?.is_admin;
  if (isDonoSemBarbearia && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// ─── Home Redirect ────────────────────────────────────────────────────────────

const HomeRedirect = () => {
  const { isAuthenticated, role, isLoading, currentUser } = useAuth();
  if (isLoading)        return <LoadingScreen />;
  if (!isAuthenticated) return <Landing />;
  if (role === "barbeiro") {
    const userJob = (currentUser?.job_title || "").toLowerCase().trim();
    const isStaffWithoutDashboard = userJob === "gerente" || userJob === "secretária" || userJob === "secretaria";
    const targetPath = currentUser?.barbearia_id
      ? (isStaffWithoutDashboard ? "/agendamentos" : "/dashboard")
      : "/onboarding";
    return <Navigate to={targetPath} replace />;
  }
  return <Navigate to="/descobrir" replace />;
};

// ─── Rotas ───────────────────────────────────────────────────────────────────

const AppRoutes = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingScreen message="Carregando interface..." />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* Autenticação e públicas */}
        <Route path="/login-cliente"            element={<SignupCliente />} />
        <Route path="/login-barbeiro"           element={<SignupBarbeiro />} />
        <Route path="/convite-aceito"           element={<WelcomeBarber />} />
        <Route path="/cadastro"                 element={<Navigate to="/login-cliente" replace />} />
        <Route path="/reset-password"           element={<ResetPassword />} />
        <Route path="/atualizar-senha"          element={<ResetPassword />} />
        <Route path="/auth/callback"            element={<AuthCallback />} />
        <Route path="/auth/callback-barbeiro"   element={<AuthCallbackBarbeiro />} />

        {/* Legal */}
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/cookies"     element={<Privacidade />} />
        <Route path="/termos"      element={<TermosUso />} />
        <Route path="/faq"         element={<FAQ />} />

        {/* Ecossistema cliente */}
        <Route path="/descobrir"          element={<ClientPortal />} />
        <Route path="/agendar"            element={<Index />} />
        <Route path="/meus-agendamentos"  element={<ProtectedRoute allowedRoles={["cliente"]}><MyAppointments /></ProtectedRoute>} />
        <Route path="/perfil/cliente"     element={<ProtectedRoute allowedRoles={["cliente"]}><ClientProfile /></ProtectedRoute>} />
        <Route path="/favoritos"          element={<ProtectedRoute allowedRoles={["cliente","barbeiro"]}><Favorites /></ProtectedRoute>} />
        <Route path="/checkout"           element={<ProtectedRoute allowedRoles={["cliente"]}><Checkout /></ProtectedRoute>} />
        <Route path="/sucesso"            element={<ProtectedRoute allowedRoles={["cliente"]}><BookingSuccess /></ProtectedRoute>} />

        {/* Ecossistema barbearia (livres de layout) */}
        <Route path="/onboarding" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Onboarding /></ProtectedRoute>} />
        <Route path="/bancada"    element={<ProtectedRoute allowedRoles={["barbeiro"]}><Workstation /></ProtectedRoute>} />

        {/* Workspace B2B com sidebar */}
        <Route element={<ProtectedRoute allowedRoles={["barbeiro"]}><BarberLayout /></ProtectedRoute>}>
          <Route path="/dashboard"              element={<Dashboard />} />
          <Route path="/agendamentos"           element={<Agenda />} />
          <Route path="/servicos"               element={<Servicos />} />
          <Route path="/perfil/barbeiro"        element={<BarberProfile />} />
          <Route path="/financeiro"             element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="finance"><Financial /></ProtectedRoute>} />
          <Route path="/equipe"                 element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="team"><Team /></ProtectedRoute>} />
          <Route path="/dashboard/configuracoes" element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="settings"><BarbershopSettings /></ProtectedRoute>} />
          <Route path="/produtos"               element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="products"><Products /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

// ─── App root ─────────────────────────────────────────────────────────────────

const App = () => (
  // ✅ QueryClient centralizado com staleTime, gcTime e retry configurados
  // Arquivo: src/lib/queryClient.ts
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" closeButton richColors />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;