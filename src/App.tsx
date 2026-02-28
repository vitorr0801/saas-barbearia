import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/descobrir" element={<ClientPortal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/setup" element={<Onboarding />} />
          <Route path="/bancada" element={<Workstation />} />
          <Route path="/perfil/cliente" element={<ClientProfile />} />
          <Route path="/perfil/barbeiro" element={<BarberProfile />} />
          <Route path="/cadastro" element={<Signup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
