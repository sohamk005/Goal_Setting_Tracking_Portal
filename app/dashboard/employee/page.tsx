"use client";

import { useMemo, useState } from "react";
import {
  ClipboardListIcon,
  LockIcon,
  PercentIcon,
  TargetIcon,
} from "lucide-react";

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
import { cn } from "@/lib/utils";
import { validateGoalSheet, type Goal, type GoalSheet } from "@/types/goal";

const INITIAL_GOAL_SHEET: GoalSheet = {
  is_locked: false,
  goals: [
    {
      id: "g1",
      title: "Increase pipeline conversion",
      targets: "Lift qualified lead-to-opportunity rate from 18% to 25% by Q4.",
      weightage: 35,
    },
    {
      id: "g2",
      title: "Customer retention uplift",
      targets: "Reduce logo churn below 4% and improve NPS to 52+.",
      weightage: 25,
      shared_from_id: "mgr-goal-retention-01",
    },
    {
      id: "g3",
      title: "Enablement & documentation",
      targets: "Publish 6 playbooks and run 2 cross-team workshops.",
      weightage: 20,
    },
    {
      id: "g4",
      title: "Operational excellence",
      targets: "Cut cycle time on priority requests by 15%.",
      weightage: 20,
    },
  ],
};

export default function EmployeeDashboardPage() {
  const { currentUser } = useUser();
  const [goalSheet, setGoalSheet] = useState<GoalSheet>(INITIAL_GOAL_SHEET);

  const validation = useMemo(
    () => validateGoalSheet(goalSheet.goals),
    [goalSheet.goals],
  );

  const totalWeightage = validation.totalWeightage;

  const handleSubmitGoalSheet = (goals: Goal[]) => {
    setGoalSheet((prev) => ({ ...prev, goals }));
  };

  const toggleLocked = () => {
    setGoalSheet((prev) => ({ ...prev, is_locked: !prev.is_locked }));
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Employee Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUser.name} · FY goal sheet overview
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLocked}
            className="hover:bg-muted hover:text-foreground"
          >
            {goalSheet.is_locked ? "Unlock sheet (demo)" : "Lock sheet (demo)"}
          </Button>
          <CreateGoalSheetDialog
            goals={goalSheet.goals}
            isLocked={goalSheet.is_locked}
            onSubmit={handleSubmitGoalSheet}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Active goals</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <TargetIcon className="size-5 text-muted-foreground" />
              {goalSheet.goals.length}
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
              {goalSheet.is_locked ? (
                <>
                  <LockIcon className="size-5 text-amber-600" />
                  Locked
                </>
              ) : (
                <>
                  <ClipboardListIcon className="size-5 text-muted-foreground" />
                  Editable
                </>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {!validation.canSubmit && !goalSheet.is_locked ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Submission requirements</CardTitle>
            <CardDescription>
              Goal sheet must pass all hackathon rules before it can be submitted
              from the dialog.
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

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Current goals</CardTitle>
          <CardDescription>
            Your active FY objectives and weightage allocation.
          </CardDescription>
          <CardAction>
            {goalSheet.is_locked ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                <LockIcon className="size-3" />
                Locked
              </span>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead className="hidden md:table-cell">Targets</TableHead>
                <TableHead className="text-right">Weightage</TableHead>
                <TableHead className="hidden sm:table-cell">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goalSheet.goals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No goals yet. Create a goal sheet to get started.
                  </TableCell>
                </TableRow>
              ) : (
                goalSheet.goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.title}</TableCell>
                    <TableCell className="hidden max-w-md truncate md:table-cell">
                      {goal.targets}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {goal.weightage}%
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {goal.shared_from_id ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                          Shared
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Own
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
