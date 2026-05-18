"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, SparklesIcon, UserCircle2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "HR Admin",
};

const ROLE_COLORS: Record<string, string> = {
  employee: "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  manager: "bg-violet-500/15 text-violet-400 ring-violet-500/25",
  admin: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
};

export function IdentitySwitcherBanner() {
  const router = useRouter();
  const { currentUser, loading, signOut } = useUser();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully.");
    router.push("/login");
  };

  // Don't render on auth pages (currentUser is null when loading or unauthenticated)
  if (loading || !currentUser) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-11 w-full shrink-0 border-b border-border/60",
        "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
        "supports-[backdrop-filter]:bg-background/70",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]",
      )}
    >
      <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <SparklesIcon className="size-4 shrink-0 text-amber-400" />
          <span className="hidden font-semibold text-foreground sm:inline">
            AtomQuest Portal
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <UserCircle2Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="hidden truncate text-muted-foreground sm:inline">
              {currentUser.name}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                ROLE_COLORS[currentUser.role] ?? ROLE_COLORS.employee,
              )}
            >
              {ROLE_LABELS[currentUser.role] ?? currentUser.role}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="h-7 gap-1.5 border-border bg-background px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon className="size-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
