"use client";

import { CheckIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_USERS, useUser, type UserRole } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "HR Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  employee: "bg-sky-500/15 text-sky-500 ring-sky-500/25",
  manager: "bg-violet-500/15 text-violet-500 ring-violet-500/25",
  admin: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/25",
};

export function IdentitySwitcherBanner() {
  const { currentUser, switchUser, loading } = useUser();
  const router = useRouter();

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

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Acting as
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "group flex items-center gap-2 rounded-full border border-border/50 bg-background/50 py-1 pl-1 pr-2",
                "text-sm font-medium shadow-sm transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              )}
            >
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full ring-1 ring-inset",
                  ROLE_COLORS[currentUser.role],
                )}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="max-w-[120px] truncate sm:max-w-[160px]">
                {currentUser.name}
              </span>
              <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {MOCK_USERS.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => {
                    switchUser(user.role);
                    router.push(`/dashboard/${user.role}`);
                  }}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  {currentUser.id === user.id && (
                    <CheckIcon className="size-4 text-emerald-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
