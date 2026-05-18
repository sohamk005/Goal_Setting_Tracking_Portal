"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  CircleDotIcon,
  CircleIcon,
  ClipboardListIcon,
  Loader2Icon,
  LockIcon,
  PercentIcon,
  TargetIcon,
} from "lucide-react";
import { toast } from "sonner";

import { CreateGoalSheetDialog } from "@/components/employee/create-goal-sheet-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/context/UserContext";
import {
  fetchMyGoals,
  submitGoalSheet,
  updateGoalStatus,
} from "@/lib/employee-service";
import { cn } from "@/lib/utils";
import {
  UOM_LABELS,
  validateGoalSheet,
  type Goal,
  type GoalStatus,
} from "@/types/goal";
import type { EmployeeGoal } from "@/types/manager";

const STATUS_OPTIONS: { value: GoalStatus; label: string; icon: React.ElementType }[] = [
  { value: "not_started", label: "Not Started", icon: CircleIcon },
  { value: "on_track", label: "On Track", icon: CircleDotIcon },
  { value: "completed", label: "Completed", icon: CheckCircle2Icon },
];

const STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: "text-slate-400",
  on_track: "text-sky-400",
  completed: "text-emerald-400",
};

function employeeGoalToGoal(eg: EmployeeGoal): Goal {
  return {
    id: eg.id,
    title: eg.title,
    targets: eg.targets,
    thrust_area: eg.thrust_area ?? "Unassigned",
    uom_type: eg.uom_type ?? "numeric",
    target_value: eg.target_value,
    weightage: eg.weightage,
    status: eg.status ?? "not_started",
    quarter: eg.quarter ?? "Q1",
  };
}

export default function EmployeeDashboardPage() {
  const { currentUser, loading: authLoading } = useUser();
  const router = useRouter();

  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await fetchMyGoals(currentUser.id);
      setGoals(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load goals.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (currentUser.role !== "employee") {
      router.push(`/dashboard/${currentUser.role}`);
      return;
    }
    void loadGoals();
  }, [authLoading, currentUser, loadGoals, router]);

  const isLocked = goals.length > 0 && goals.every((g) => g.is_locked);
  const goalObjs: Goal[] = goals.map(employeeGoalToGoal);
  const validation = useMemo(() => validateGoalSheet(goalObjs), [goalObjs]);
  const totalWeightage = validation.totalWeightage;

  const handleSubmitGoalSheet = async (updatedGoals: Goal[]) => {
    if (!currentUser?.manager_id) {
      toast.error("No manager assigned to your profile. Contact HR Admin.");
      return;
    }
    setSaving(true);
    try {
      await submitGoalSheet(
        updatedGoals,
        currentUser.id,
        currentUser.name,
        currentUser.manager_id,
      );
      toast.success("Goal sheet submitted to your manager for approval.");
      await loadGoals();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save goal sheet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (goalId: string, status: GoalStatus) => {
    try {
      await updateGoalStatus(goalId, status);
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, status } : g)),
      );
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        Loading your goals…
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Employee Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUser.name} · FY goal sheet overview
          </p>
          {isLocked && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Your goal sheet is locked and under manager review.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CreateGoalSheetDialog
            goals={goalObjs}
            isLocked={isLocked}
            onSubmit={handleSubmitGoalSheet}
            saving={saving}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Active goals</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <TargetIcon className="size-5 text-muted-foreground" />
              {goals.length}
              <span className="text-sm font-normal text-muted-foreground">
                / 8 max
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total weightage</CardDescription>
            <CardTitle
              className={cn(
                "flex items-center gap-2 text-2xl tabular-nums",
                validation.totalIs100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : undefined,
              )}
            >
              <PercentIcon className="size-5 text-muted-foreground" />
              {totalWeightage}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Must equal 100% before submission
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Sheet status</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              {isLocked ? (
                <>
                  <LockIcon className="size-5 text-amber-600" />
                  Locked
                </>
              ) : (
                <>
                  <ClipboardListIcon className="size-5 text-muted-foreground" />
                  {goals.length === 0 ? "No goals yet" : "Editable"}
                </>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Validation errors */}
      {!validation.canSubmit && !isLocked && goals.length > 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Submission requirements</CardTitle>
            <CardDescription>
              Goal sheet must pass all rules before it can be submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {validation.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Goals table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Current goals</CardTitle>
          <CardDescription>
            Your active FY objectives, weightage allocation, and quarterly
            status.
          </CardDescription>
          <CardAction>
            {isLocked ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                <LockIcon className="size-3" />
                Locked — awaiting manager review
              </span>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead className="hidden lg:table-cell">Thrust Area</TableHead>
                <TableHead className="hidden md:table-cell">UoM</TableHead>
                <TableHead className="text-right">Weightage</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No goals yet. Click &quot;Create New Goal Sheet&quot; to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                goals.map((goal) => {
                  const statusOpt =
                    STATUS_OPTIONS.find((s) => s.value === goal.status) ??
                    STATUS_OPTIONS[0];
                  const StatusIcon = statusOpt.icon;
                  return (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div className="font-medium">{goal.title}</div>
                        <div className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                          {goal.targets}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {goal.thrust_area ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                        {UOM_LABELS[goal.uom_type as keyof typeof UOM_LABELS] ??
                          goal.uom_type}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {goal.weightage}%
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {/* Status selector — disabled when locked */}
                        {isLocked ? (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              STATUS_COLORS[
                                (goal.status as GoalStatus) ?? "not_started"
                              ],
                            )}
                          >
                            <StatusIcon className="size-3.5" />
                            {statusOpt.label}
                          </span>
                        ) : (
                          <select
                            value={goal.status ?? "not_started"}
                            onChange={(e) =>
                              void handleStatusChange(
                                goal.id,
                                e.target.value as GoalStatus,
                              )
                            }
                            className="rounded border border-input bg-transparent px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            aria-label={`Status for ${goal.title}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {goal.review_status === "approved" ? (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                            Approved
                          </span>
                        ) : goal.review_status === "rework" ? (
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                            Rework required
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
