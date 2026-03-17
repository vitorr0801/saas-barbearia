"use client"

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Importações de páginas (Mantidas conforme seu original)
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

const queryClient = new QueryClient();

/**
 * 🌀 COMPONENTE DE LOADING UNIFICADO
 * Para manter a identidade visual em qualquer transição de rota.
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
 * 🛡️ PROTECTED ROUTE
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

  // 🛡️ Enquanto houver dúvida, mostramos o Loading em vez de null
  if (isLoading || (isAuthenticated && !role)) {
    return <LoadingScreen message="Verificando permissões..." />; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/cadastro" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    // Se o cara tenta entrar onde não deve, mandamos para a raiz (onde o HomeRedirect decide o destino dele)
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * 🔀 HOME REDIRECT
 */
const HomeRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) return <Landing />;
  
  // Se está logado mas o role ainda não carregou (segurança de milissegundos)
  if (!role) return <LoadingScreen message="Sincronizando Perfil..." />; 

  return <Navigate to={role === "barbeiro" ? "/dashboard" : "/descobrir"} replace />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/cadastro" element={<Signup />} />
        <Route path="/agendar" element={<Index />} />
        
        {/* 🚀 DICA: Se o ClientPortal precisa do nome do usuário, ele deve ser Protegido */}
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