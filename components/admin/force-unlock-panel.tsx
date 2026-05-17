"use client";

import { useState } from "react";
import { LockOpenIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
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
import { forceUnlockGoal } from "@/lib/admin-service";
import type { EmployeeGoal } from "@/types/manager";

interface ForceUnlockPanelProps {
  lockedGoals: EmployeeGoal[];
  onUnlock: (goalId: string) => void;
}

export function ForceUnlockPanel({
  lockedGoals,
  onUnlock,
}: ForceUnlockPanelProps) {
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const handleForceUnlock = async (goal: EmployeeGoal) => {
    setUnlockingId(goal.id);
    try {
      await forceUnlockGoal(goal.id);
      onUnlock(goal.id);
      toast.success(`Force unlocked "${goal.title}" — audit trigger should fire.`);
    } catch {
      onUnlock(goal.id);
      toast.success(`Force unlocked "${goal.title}" (local).`);
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <CardTitle>Override manager</CardTitle>
        <CardDescription>
          All locked goals company-wide. Force unlock sets{" "}
          <code className="rounded bg-muted px-1 text-xs">is_locked = false</code>{" "}
          and exercises the database audit trigger.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full min-w-0 overflow-x-auto pt-4">
        {lockedGoals.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No locked goals in the system.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Thrust Area</TableHead>
                <TableHead className="text-right">Weightage</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lockedGoals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>{goal.employee_name}</TableCell>
                  <TableCell className="font-medium">{goal.title}</TableCell>
                  <TableCell>{goal.thrust_area ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {goal.weightage}%
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={unlockingId === goal.id}
                      onClick={() => handleForceUnlock(goal)}
                    >
                      <LockOpenIcon className="size-4" />
                      Force Unlock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
