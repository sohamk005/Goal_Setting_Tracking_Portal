"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, UserCircle2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, type UserRole } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: { role: UserRole; label: string }[] = [
  { role: "employee", label: "Employee" },
  { role: "manager", label: "Manager" },
  { role: "admin", label: "HR Admin" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "HR Admin",
};

export function IdentitySwitcherBanner() {
  const router = useRouter();
  const { currentUser, switchUser } = useUser();

  const handleRoleSwitch = (role: UserRole) => {
    if (role === currentUser.role) return;

    switchUser(role);
    toast.success("Swapped Identity Successfully!");
    router.push(`/dashboard/${role}`);
  };

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
          <UserCircle2Icon className="size-4 shrink-0 text-foreground/80" />
          <span className="truncate">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {currentUser.name}
            </span>
          </span>
        </Link>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
            >
              {ROLE_LABELS[currentUser.role]}
              <ChevronDownIcon className="size-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuLabel>Switch identity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLE_OPTIONS.map(({ role, label }) => (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={cn(
                  currentUser.role === role &&
                    "bg-accent font-medium text-accent-foreground",
                )}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
