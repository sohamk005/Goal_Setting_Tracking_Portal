"use client";

import { useMemo, useState } from "react";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveAndLockEmployeeGoals,
  returnGoalsForRework,
} from "@/lib/goals-service";
import type { EmployeeGoal, EmployeeGoalGroup } from "@/types/manager";
import { cn } from "@/lib/utils";

function groupGoalsByEmployee(goals: EmployeeGoal[]): EmployeeGoalGroup[] {
  const map = new Map<string, EmployeeGoalGroup>();

  for (const goal of goals) {
    const existing = map.get(goal.employee_id);
    if (existing) {
      existing.goals.push(goal);
    } else {
      map.set(goal.employee_id, {
        employee_id: goal.employee_id,
        employee_name: goal.employee_name,
        goals: [goal],
      });
    }
  }

  return Array.from(map.values());
}

interface GoalEvaluationPanelProps {
  goals: EmployeeGoal[];
  managerId: string;
  onGoalsChange: (goals: EmployeeGoal[]) => void;
}

export function GoalEvaluationPanel({
  goals,
  managerId,
  onGoalsChange,
}: GoalEvaluationPanelProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const groups = useMemo(() => groupGoalsByEmployee(goals), [goals]);

  const updateGoal = (goalId: string, patch: Partial<EmployeeGoal>) => {
    onGoalsChange(
      goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)),
    );
  };

  const applyLocalEmployeePatch = (
    employeeId: string,
    patch: Partial<EmployeeGoal>,
  ) => {
    onGoalsChange(
      goals.map((goal) =>
        goal.employee_id === employeeId ? { ...goal, ...patch } : goal,
      ),
    );
  };

  const handleApproveAndLock = async (group: EmployeeGoalGroup) => {
    setPendingAction(group.employee_id);
    try {
      await approveAndLockEmployeeGoals(
        group.employee_id,
        managerId,
        goals,
      );
      applyLocalEmployeePatch(group.employee_id, {
        is_locked: true,
        review_status: "approved",
      });
      toast.success(`${group.employee_name}'s goal sheet approved and locked.`);
    } catch {
      applyLocalEmployeePatch(group.employee_id, {
        is_locked: true,
        review_status: "approved",
      });
      toast.success(
        `${group.employee_name}'s goal sheet approved and locked (local).`,
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleReturnForRework = async (group: EmployeeGoalGroup) => {
    setPendingAction(`rework-${group.employee_id}`);
    try {
      await returnGoalsForRework(group.employee_id, managerId);
      applyLocalEmployeePatch(group.employee_id, {
        is_locked: false,
        review_status: "rework",
      });
      toast.message(`${group.employee_name}'s sheet returned for rework.`);
    } catch {
      applyLocalEmployeePatch(group.employee_id, {
        is_locked: false,
        review_status: "rework",
      });
      toast.message(
        `${group.employee_name}'s sheet returned for rework (local).`,
      );
    } finally {
      setPendingAction(null);
    }
  };

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No direct-report goals found for this manager.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {groups.map((group) => {
        const allLocked = group.goals.every((g) => g.is_locked);
        const isPending = pendingAction === group.employee_id;
        const isReworkPending = pendingAction === `rework-${group.employee_id}`;

        return (
          <Card key={group.employee_id} className="w-full">
            <CardHeader className="border-b">
              <CardTitle>{group.employee_name}</CardTitle>
              <CardDescription>
                {group.goals.length} goal{group.goals.length === 1 ? "" : "s"} ·
                Inline edit targets and weightage, then approve or return.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full min-w-0 pt-4">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal</TableHead>
                    <TableHead className="min-w-[220px]">Target</TableHead>
                    <TableHead className="w-28">Weightage</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.goals.map((goal) => {
                    const editable = !goal.is_locked;

                    return (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">
                          {goal.title}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={goal.targets}
                            onChange={(e) =>
                              updateGoal(goal.id, { targets: e.target.value })
                            }
                            disabled={!editable}
                            className={cn(
                              "h-8",
                              !editable && "border-transparent bg-muted/40",
                            )}
                            aria-label={`Target for ${goal.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={goal.weightage}
                              onChange={(e) =>
                                updateGoal(goal.id, {
                                  weightage: Number(e.target.value) || 0,
                                })
                              }
                              disabled={!editable}
                              className={cn(
                                "h-8 w-20 tabular-nums",
                                !editable && "border-transparent bg-muted/40",
                              )}
                              aria-label={`Weightage for ${goal.title}`}
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                              goal.is_locked
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : goal.review_status === "rework"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {goal.is_locked ? "locked" : goal.review_status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={isReworkPending || isPending}
                onClick={() => handleReturnForRework(group)}
                className="hover:bg-muted hover:text-foreground"
              >
                <RotateCcwIcon className="size-4" />
                Return for Rework
              </Button>
              <Button
                size="sm"
                disabled={allLocked || isPending || isReworkPending}
                onClick={() => handleApproveAndLock(group)}
                className="hover:text-primary-foreground"
              >
                <CheckIcon className="size-4" />
                Approve & Lock
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
