"use client";

import { ThemeProvider } from "next-themes";

import { IdentitySwitcherBanner } from "@/components/identity-switcher-banner";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserProvider>
        <div className="flex min-h-full flex-col">
          <IdentitySwitcherBanner />
          <div className="relative z-0 flex flex-1 flex-col">
            {children}
          </div>
          <Toaster />
        </div>
      </UserProvider>
    </ThemeProvider>
  );
}
