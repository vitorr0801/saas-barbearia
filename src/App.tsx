"use client"

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// 🚀 ARQUITETURA TIER-1: Importação Absoluta do Layout Administrativo
import { BarberLayout } from "@/components/layout/BarberLayout";

/**
 * 🚀 OTIMIZAÇÃO TIER-1: LAZY LOADING (Resolução de Módulos Absoluta com Path Aliasing)
 */
const Landing = lazy(() => import("@/pages/Landing"));
const ClientPortal = lazy(() => import("@/pages/ClientPortal"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agenda = lazy(() => import("@/pages/Agenda"));
const Financial = lazy(() => import("@/pages/Financial"));
const Products = lazy(() => import("@/pages/Products"));
const Servicos = lazy(() => import("@/pages/Servicos")); 
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Workstation = lazy(() => import("./pages/Workstation"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const BarberProfile = lazy(() => import("./pages/BarberProfile"));
const BarbershopSettings = lazy(() => import("./pages/BarbershopSettings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Team = lazy(() => import("./pages/Team"));
const Index = lazy(() => import("./pages/Index"));
const Checkout = lazy(() => import("./pages/Checkout"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const SignupCliente = lazy(() => import("./pages/auth/SignupCliente"));
const SignupBarbeiro = lazy(() => import("./pages/auth/SignupBarbeiro"));
const WelcomeBarber = lazy(() => import("./pages/auth/WelcomeBarber")); 
const AuthCallback = lazy(() => import("./pages/AuthCallback")); 
const AuthCallbackBarbeiro = lazy(() => import("./pages/AuthCallbackBarbeiro"));
// 🚀 TIER-1: Novas Páginas de Compliance Legal (Obrigatórias para Gateway de Pagamento)
const Privacidade = lazy(() => import("./pages/legal/Privacidade"));
const TermosUso = lazy(() => import("./pages/legal/Termos"));
const FAQ = lazy(() => import("./pages/legal/FAQ"));
const queryClient = new QueryClient();
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

/**
 * 🛡️ PROTECTED ROUTE (Arquitetura RBAC Mundial)
 */
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

  // 1. Verificação de Autenticação
  if (!isAuthenticated) {
    const isBarberRoute = ["dashboard", "onboarding", "financeiro", "equipe", "produtos", "servicos", "agendamentos"].some(
      path => location.pathname.includes(path)
    );
    const loginTarget = isBarberRoute ? "/login-barbeiro" : "/login-cliente";
    return <Navigate to={loginTarget} replace state={{ from: location }} />;
  }

  if (!role) return <LoadingScreen message="Sincronizando perfil..." />;

  // 2. Verificação de Papel (Role)
  if (allowedRoles && !allowedRoles.includes(role as any)) {
    return <Navigate to="/" replace />;
  }

  // 3. 🚀 CONTROLE DE ACESSO AVANÇADO (RBAC)
  if (requiredModule && role === "barbeiro") {
    const isOwner = Boolean(currentUser?.is_admin);
    const userJob = (currentUser?.job_title || "barbeiro").toLowerCase().trim();
    const isManager = userJob === "gerente";
    const isSecretary = userJob === "secretária" || userJob === "secretaria";

    let hasAccess = false;
    if (requiredModule === "finance") hasAccess = isOwner;
    if (requiredModule === "team") hasAccess = isOwner || isManager;
    if (requiredModule === "settings") hasAccess = isOwner || isManager;
    if (requiredModule === "products") hasAccess = isOwner || isManager || isSecretary;

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const isDonoSemBarbearia = role === "barbeiro" && !currentUser?.barbearia_id && currentUser?.is_admin;

  if (isDonoSemBarbearia && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

const HomeRedirect = () => {
  const { isAuthenticated, role, isLoading, currentUser } = useAuth();

  if (isLoading) return <LoadingScreen />;
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

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen message="Carregando interface..." />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          
          {/* --- ROTAS DE AUTENTICAÇÃO E PÚBLICAS --- */}
          <Route path="/login-cliente" element={<SignupCliente />} />
          <Route path="/login-barbeiro" element={<SignupBarbeiro />} />
          <Route path="/convite-aceito" element={<WelcomeBarber />} />
          <Route path="/cadastro" element={<Navigate to="/login-cliente" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/atualizar-senha" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/callback-barbeiro" element={<AuthCallbackBarbeiro />} />
          
          {/* 🚀 TIER-1: Compliance Legal Aberto (Evita erros 404 no Footer) */}
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/cookies" element={<Privacidade />} /> {/* Aponta para a mesma por enquanto */}
          <Route path="/termos" element={<TermosUso />} />
          <Route path="/faq" element={<FAQ />} />

          {/* --- ECOSSISTEMA CLIENTE --- */}
          <Route path="/descobrir" element={<ClientPortal />} />
          <Route path="/agendar" element={<Index />} />
          <Route path="/meus-agendamentos" element={<ProtectedRoute allowedRoles={["cliente"]}><MyAppointments /></ProtectedRoute>} />
          <Route path="/perfil/cliente" element={<ProtectedRoute allowedRoles={["cliente"]}><ClientProfile /></ProtectedRoute>} />
          <Route path="/favoritos" element={<ProtectedRoute allowedRoles={["cliente", "barbeiro"]}><Favorites /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={["cliente"]}><Checkout /></ProtectedRoute>} />
          <Route path="/sucesso" element={<ProtectedRoute allowedRoles={["cliente"]}><BookingSuccess /></ProtectedRoute>} />
          
          {/* --- ECOSSISTEMA BARBEARIA (Telas Livres de Layout) --- */}
          <Route path="/onboarding" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Onboarding /></ProtectedRoute>} />
          <Route path="/bancada" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Workstation /></ProtectedRoute>} />

          {/* ======================================================================================= */}
          {/* 🚀 WORKSPACE B2B COM SIDEBAR (Todas as rotas filhas herdam o BarberLayout)              */}
          {/* ======================================================================================= */}
          <Route element={<ProtectedRoute allowedRoles={["barbeiro"]}><BarberLayout /></ProtectedRoute>}>
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agendamentos" element={<Agenda />} />
            <Route path="/servicos" element={<Servicos />} /> 
            <Route path="/perfil/barbeiro" element={<BarberProfile />} />
            
            {/* Módulos com verificação interna dupla (Role + Permissão Específica) */}
            <Route path="/financeiro" element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="finance"><Financial /></ProtectedRoute>} />
            <Route path="/equipe" element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="team"><Team /></ProtectedRoute>} />
            <Route path="/dashboard/configuracoes" element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="settings"><BarbershopSettings /></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute allowedRoles={["barbeiro"]} requiredModule="products"><Products /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
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