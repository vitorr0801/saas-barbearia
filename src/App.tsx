"use client"

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

/**
 * 🚀 OTIMIZAÇÃO: LAZY LOADING
 * Carregamos as páginas sob demanda para ganho de performance brutal.
 */
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Financial = lazy(() => import("./pages/Financial"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Products = lazy(() => import("./pages/Products"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Workstation = lazy(() => import("./pages/Workstation"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const BarberProfile = lazy(() => import("./pages/BarberProfile"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const Favorites = lazy(() => import("./pages/Favorites"));

const queryClient = new QueryClient();

/**
 * 🌀 LOADING SCREEN DE ALTA FIDELIDADE
 */
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
 * 🛡️ PROTECTED ROUTE (Refinado para Redirecionamento Contextual)
 */
function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: Array<"cliente" | "barbeiro"> }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || (isAuthenticated && !role)) {
    return <LoadingScreen message="Validando credenciais..." />; 
  }

  if (!isAuthenticated) {
    // 💡 UX de Elite: Salvamos de onde o usuário veio para devolvê-lo após o login
    return <Navigate to="/cadastro" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role as any)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * 🔀 HOME REDIRECT
 */
const HomeRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading || (isAuthenticated && !role)) {
    return <LoadingScreen message="Preparando seu acesso..." />;
  }

  if (!isAuthenticated) return <Landing />;
  
  return <Navigate to={role === "barbeiro" ? "/dashboard" : "/descobrir"} replace />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      {/* O Suspense gerencia o tempo de carregamento dos arquivos 'lazy' */}
      <Suspense fallback={<LoadingScreen message="Carregando interface..." />}>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* 🎯 ACESSO CONVIDADO: ClientPortal e Agendamento agora são abertos */}
          <Route path="/descobrir" element={<ClientPortal />} />
          <Route path="/agendar" element={<Index />} />
          
          {/* --- ROTAS PROTEGIDAS: BARBEIRO --- */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/agendamentos" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Agenda /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Financial /></ProtectedRoute>} />
          <Route path="/produtos" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Products /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Onboarding /></ProtectedRoute>} />
          <Route path="/bancada" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Workstation /></ProtectedRoute>} />
          <Route path="/perfil/barbeiro" element={<ProtectedRoute allowedRoles={["barbeiro"]}><BarberProfile /></ProtectedRoute>} />

          {/* --- ROTAS PROTEGIDAS: CLIENTE --- */}
          <Route path="/meus-agendamentos" element={<ProtectedRoute allowedRoles={["cliente"]}><MyAppointments /></ProtectedRoute>} />
          <Route path="/perfil/cliente" element={<ProtectedRoute allowedRoles={["cliente"]}><ClientProfile /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={["cliente"]}><Checkout /></ProtectedRoute>} />
          <Route path="/favoritos" element={<ProtectedRoute allowedRoles={["cliente", "barbeiro"]}><Favorites /></ProtectedRoute>} />

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
      <Sonner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;