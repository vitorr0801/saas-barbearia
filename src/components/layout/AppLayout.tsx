import { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className="pb-20 md:pb-0 md:pt-16">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
