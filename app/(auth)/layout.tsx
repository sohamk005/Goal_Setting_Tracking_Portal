import type { ReactNode } from "react";

// Auth pages have their own layout (no nav banner, centered)
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-950 px-4 py-16">
      {children}
    </div>
  );
}
