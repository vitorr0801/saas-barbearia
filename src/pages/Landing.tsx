import { Header } from "../components/Header";
import { HeroSection } from "../components/hero-section";
import { FeaturesSection } from "../components/features-section";
import { ProblemSection } from "../components/problem-section";
import { DashboardPreview } from "../components/dashboard-preview";
import { CTASection } from "../components/cta-section";
import { Footer } from "../components/footer";

export default function Landing() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <ProblemSection />
        <DashboardPreview />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

