"use client"

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Importações de páginas
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import ClientPortal from "./pages/ClientPortal";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Financial from "./pages/Financial";
import Checkout from "./pages/Checkout";
import Products from "./pages/Products";
import Onboarding from "./pages/Onboarding";
import Workstation from "./pages/Workstation";
import ClientProfile from "./pages/ClientProfile";
import BarberProfile from "./pages/BarberProfile";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import MyAppointments from "./pages/MyAppointments";
import Favorites from "./pages/Favorites"; // 🚀 1. Importando a nova página de Elite

const queryClient = new QueryClient();

/**
 * 🌀 COMPONENTE DE LOADING UNIFICADO
 */
const LoadingScreen = ({ message = "Autenticando..." }: { message?: string }) => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-black text-muted-foreground animate-pulse tracking-tighter uppercase">
        {message}
      </p>
    </div>
  </div>
);

/**
 * 🛡️ PROTECTED ROUTE (Versão Sincronizada)
 */
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: Array<"cliente" | "barbeiro">;
}) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || (isAuthenticated && !role)) {
    return <LoadingScreen message="Validando permissões..." />; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/cadastro" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role as any)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * 🔀 HOME REDIRECT (O Cérebro da Navegação)
 */
const HomeRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading || (isAuthenticated && !role)) {
    return <LoadingScreen message="Preparando seu portal..." />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }
  
  const destination = role === "barbeiro" ? "/dashboard" : "/descobrir";
  return <Navigate to={destination} replace />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/cadastro" element={<Signup />} />
        <Route path="/agendar" element={<Index />} />
        
        {/* Portal de Descoberta */}
        <Route 
          path="/descobrir" 
          element={
            <ProtectedRoute allowedRoles={["cliente", "barbeiro"]}>
              <ClientPortal />
            </ProtectedRoute>
          } 
        />

        {/* Rotas Protegidas - BARBEIRO */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Dashboard /></ProtectedRoute>} />
        <Route path="/agendamentos" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Agenda /></ProtectedRoute>} />
        <Route path="/financeiro" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Financial /></ProtectedRoute>} />
        <Route path="/produtos" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Products /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Onboarding /></ProtectedRoute>} />
        <Route path="/bancada" element={<ProtectedRoute allowedRoles={["barbeiro"]}><Workstation /></ProtectedRoute>} />
        <Route path="/perfil/barbeiro" element={<ProtectedRoute allowedRoles={["barbeiro"]}><BarberProfile /></ProtectedRoute>} />

        {/* Rotas Protegidas - CLIENTE */}
        <Route path="/meus-agendamentos" element={<ProtectedRoute allowedRoles={["cliente"]}><MyAppointments /></ProtectedRoute>} />
        <Route path="/perfil/cliente" element={<ProtectedRoute allowedRoles={["cliente"]}><ClientProfile /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={["cliente"]}><Checkout /></ProtectedRoute>} />
        
        {/* ⭐ 2. NOVA ROTA DE FAVORITOS (Otimizada) */}
        <Route 
          path="/favoritos" 
          element={
            <ProtectedRoute allowedRoles={["cliente", "barbeiro"]}>
              <Favorites />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
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
};

export default App;