import { Header } from "../components/Header";
import { HeroSection } from "../components/hero-section";
import { ProblemSection } from "../components/problem-section";
import { DashboardPreview } from "../components/dashboard-preview";
import { FeaturesSection } from "../components/features-section";
import { CTASection } from "../components/cta-section";
import { Footer } from "../components/footer";

export default function Landing() {
  return (
    <>
      <Header />
      {/* 🚀 TIER-1 FIX: pt-20 (80px) alinhado perfeitamente com a altura do novo Header Glassmorphism */}
      <main className="pt-20">
        <HeroSection />
        
        {/* 🚀 Framework PAS: Problema (Dor) -> Preview (Cura) -> Funcionalidades (Lógica) */}
        <ProblemSection />
        <DashboardPreview />
        <FeaturesSection />
        
        <CTASection />
      </main>
      <Footer />
    </>
  );
}