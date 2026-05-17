"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DownloadIcon, Loader2Icon, ShieldIcon } from "lucide-react";
import { toast } from "sonner";

import { AuditLogsTable } from "@/components/admin/audit-logs-table";
import { ExecutiveCharts } from "@/components/admin/executive-charts";
import { ForceUnlockPanel } from "@/components/admin/force-unlock-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import {
  aggregateCompletionByThrust,
  aggregateThrustWeightage,
  fetchAllGoals,
  fetchAuditLogs,
  fetchCheckInsForAnalytics,
  fetchLockedGoals,
} from "@/lib/admin-service";
import { downloadGoalsCsv } from "@/lib/export-goals-csv";
import type { AuditLog } from "@/types/admin";
import type { EmployeeGoal, QuarterlyCheckIn } from "@/types/manager";

export default function AdminDashboardPage() {
  const { currentUser } = useUser();

  const [allGoals, setAllGoals] = useState<EmployeeGoal[]>([]);
  const [lockedGoals, setLockedGoals] = useState<EmployeeGoal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [checkIns, setCheckIns] = useState<QuarterlyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsResult, lockedResult, logsResult, checkInsResult] =
        await Promise.all([
          fetchAllGoals(),
          fetchLockedGoals(),
          fetchAuditLogs(),
          fetchCheckInsForAnalytics(),
        ]);

      setAllGoals(goalsResult.goals);
      setLockedGoals(lockedResult.goals);
      setAuditLogs(logsResult.logs);
      setCheckIns(checkInsResult.checkIns);
      setUsingMockData(
        goalsResult.fromMock ||
          lockedResult.fromMock ||
          logsResult.fromMock ||
          checkInsResult.fromMock,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser.role !== "admin") return;
    loadData();
  }, [currentUser.role, loadData]);

  const thrustWeightage = useMemo(
    () => aggregateThrustWeightage(allGoals),
    [allGoals],
  );

  const completionByThrust = useMemo(
    () => aggregateCompletionByThrust(allGoals, checkIns),
    [allGoals, checkIns],
  );

  const handleUnlock = (goalId: string) => {
    setLockedGoals((prev) => prev.filter((g) => g.id !== goalId));
    setAllGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, is_locked: false } : g)),
    );
    void loadData();
  };

  const handleExportCsv = () => {
    if (allGoals.length === 0) {
      toast.error("No goals available to export.");
      return;
    }
    downloadGoalsCsv(allGoals);
    toast.success(`Exported ${allGoals.length} goals to CSV.`);
  };

  if (currentUser.role !== "admin") {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-12 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Executive dashboard</CardTitle>
            <CardDescription>
              Switch to the HR Admin identity using the banner above to access
              this view.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 px-4 py-10 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ShieldIcon className="size-6 text-muted-foreground" />
            Executive Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUser.name} · Company-wide goal governance & analytics
          </p>
          {usingMockData ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Simulation data active — wire Supabase tables for production
              metrics.
            </p>
          ) : null}
        </div>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={loading}
          className="hover:bg-muted hover:text-foreground"
        >
          <DownloadIcon className="size-4" />
          Export goals CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Loading executive data…
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-8">
          <ExecutiveCharts
            thrustWeightage={thrustWeightage}
            completionByThrust={completionByThrust}
          />

          <ForceUnlockPanel
            lockedGoals={lockedGoals}
            onUnlock={handleUnlock}
          />

          <AuditLogsTable logs={auditLogs} />
        </div>
      )}
    </main>
  );
}
