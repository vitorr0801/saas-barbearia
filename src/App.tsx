import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
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

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: Array<"cliente" | "barbeiro">;
}) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // Unauthenticated users go to login/signup
  if (!isAuthenticated) {
    return <Navigate to="/cadastro" replace state={{ from: location }} />;
  }

  // Authenticated but without permission go to home
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/descobrir" element={<ClientPortal />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["barbeiro"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/agendamentos" element={<Agenda />} />
            <Route
              path="/financeiro"
              element={
                <ProtectedRoute allowedRoles={["barbeiro"]}>
                  <Financial />
                </ProtectedRoute>
              }
            />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/produtos"
              element={
                <ProtectedRoute allowedRoles={["barbeiro"]}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup"
              element={
                <ProtectedRoute allowedRoles={["barbeiro"]}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bancada"
              element={
                <ProtectedRoute allowedRoles={["barbeiro"]}>
                  <Workstation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil/cliente"
              element={
                <ProtectedRoute allowedRoles={["cliente"]}>
                  <ClientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil/barbeiro"
              element={
                <ProtectedRoute allowedRoles={["barbeiro"]}>
                  <BarberProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/cadastro" element={<Signup />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
