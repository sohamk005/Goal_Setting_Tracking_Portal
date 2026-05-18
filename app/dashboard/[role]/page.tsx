"use client";

import { notFound, useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { Loader2Icon } from "lucide-react";

import { useUser, type UserRole } from "@/context/UserContext";

const VALID_ROLES: UserRole[] = ["employee", "manager", "admin"];

// This page acts as a redirect hub — actual content is in /dashboard/[role]/
// e.g. /dashboard/employee -> renders app/dashboard/employee/page.tsx
// The [role] catch-all only fires when a specific sub-page doesn't exist.
export default function DashboardRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = use(params);
  const { currentUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    // Redirect to the correct role sub-page
    router.replace(`/dashboard/${currentUser.role}`);
  }, [loading, currentUser, router]);

  if (!VALID_ROLES.includes(role as UserRole)) {
    notFound();
  }

  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-24 text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin" />
      Redirecting…
    </div>
  );
}
