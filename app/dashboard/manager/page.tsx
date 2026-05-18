"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { GoalEvaluationPanel } from "@/components/manager/goal-evaluation-panel";
import { QuarterlyProgressPanel } from "@/components/manager/quarterly-progress-panel";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import {
  fetchGoalsForManager,
  fetchQuarterlyCheckIns,
} from "@/lib/goals-service";
import type { EmployeeGoal, QuarterlyCheckIn } from "@/types/manager";

export default function ManagerDashboardPage() {
  const { currentUser, loading: authLoading } = useUser();
  const router = useRouter();

  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [checkIns, setCheckIns] = useState<QuarterlyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const managerId = currentUser?.id ?? "";

  const loadData = useCallback(async () => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    try {
      const [goalsData, checkInsData] = await Promise.all([
        fetchGoalsForManager(managerId),
        fetchQuarterlyCheckIns(managerId),
      ]);
      setGoals(goalsData);
      setCheckIns(checkInsData);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "Failed to load team data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (currentUser.role !== "manager") {
      router.push(`/dashboard/${currentUser.role}`);
      return;
    }
    void loadData();
  }, [authLoading, currentUser, loadData, router]);

  if (authLoading || (loading && !error)) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        Loading team goals…
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "manager") return null;

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 px-4 py-10 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Manager Evaluation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentUser.name} · Reviewing direct-report goals
        </p>
        {error ? (
          <p className="mt-2 text-xs text-destructive">Error: {error}</p>
        ) : null}
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs
          defaultValue="evaluation"
          className="flex w-full min-w-0 flex-col gap-6"
        >
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="evaluation">Goal Evaluation</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="evaluation" className="w-full min-w-0">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <UsersIcon className="size-4" />
              {goals.length} goal{goals.length === 1 ? "" : "s"} across direct
              reports
            </div>
            <GoalEvaluationPanel
              goals={goals}
              managerId={managerId}
              onGoalsChange={setGoals}
            />
          </TabsContent>

          <TabsContent value="quarterly" className="w-full min-w-0">
            <QuarterlyProgressPanel
              checkIns={checkIns}
              onCheckInsChange={setCheckIns}
            />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
