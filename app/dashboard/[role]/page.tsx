"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { useUser, type UserRole } from "@/context/UserContext";

const VALID_ROLES: UserRole[] = ["employee", "manager", "admin"];

const ROLE_TITLES: Record<UserRole, string> = {
  employee: "Employee Dashboard",
  manager: "Manager Dashboard",
  admin: "HR Admin Dashboard",
};

export default function DashboardPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = use(params);
  const { currentUser } = useUser();

  if (!VALID_ROLES.includes(role as UserRole)) {
    notFound();
  }

  const dashboardRole = role as UserRole;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {ROLE_TITLES[dashboardRole]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Viewing as {currentUser.name} ({currentUser.role})
        </p>
      </div>

      <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="font-mono text-xs">{currentUser.id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{currentUser.email}</dd>
          </div>
          {currentUser.manager_id ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Manager ID</dt>
              <dd className="font-mono text-xs">{currentUser.manager_id}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </main>
  );
}
