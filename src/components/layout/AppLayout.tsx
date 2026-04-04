import { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { Header } from "@/components/Header";

interface AppLayoutProps {
  children: ReactNode;
}

/** Mesmo shell visual da /agendar: Header fino + bottom nav no mobile. */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 md:pb-0 pt-20">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
