"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2Icon, UsersIcon } from "lucide-react";

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
  const { currentUser } = useUser();
  const managerId = currentUser.id;

  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [checkIns, setCheckIns] = useState<QuarterlyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsResult, checkInsResult] = await Promise.all([
        fetchGoalsForManager(managerId),
        fetchQuarterlyCheckIns(managerId),
      ]);
      setGoals(goalsResult.goals);
      setCheckIns(checkInsResult.checkIns);
      setUsingMockData(goalsResult.fromMock || checkInsResult.fromMock);
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    if (currentUser.role !== "manager") return;
    loadData();
  }, [currentUser.role, loadData]);

  if (currentUser.role !== "manager") {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-12 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Manager evaluation</CardTitle>
            <CardDescription>
              Switch to the Manager identity using the banner above to access
              this view.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 px-4 py-10 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Manager Evaluation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentUser.name} · Reviewing direct-report goals (manager_id:{" "}
          <span className="font-mono text-xs">{managerId}</span>)
        </p>
        {usingMockData ? (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Showing simulation data — connect Supabase tables{" "}
            <code className="rounded bg-muted px-1">goals</code> and{" "}
            <code className="rounded bg-muted px-1">goal_checkins</code> for live
            data.
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Loading team goals…
        </div>
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
