"use client";

import { useEffect, useState } from "react";
import { LockIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  MAX_GOALS,
  MIN_WEIGHTAGE,
  REQUIRED_TOTAL,
  validateGoalSheet,
  type Goal,
} from "@/types/goal";

function createEmptyGoal(): Goal {
  return {
    id: crypto.randomUUID(),
    title: "",
    targets: "",
    weightage: MIN_WEIGHTAGE,
  };
}

function parseWeightageInput(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface CreateGoalSheetDialogProps {
  goals: Goal[];
  isLocked: boolean;
  onSubmit: (goals: Goal[]) => void;
  trigger?: React.ReactNode;
}

export function CreateGoalSheetDialog({
  goals,
  isLocked,
  onSubmit,
  trigger,
}: CreateGoalSheetDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftGoals, setDraftGoals] = useState<Goal[]>([createEmptyGoal()]);

  useEffect(() => {
    if (open) {
      setDraftGoals(
        goals.length > 0 ? goals.map((g) => ({ ...g })) : [createEmptyGoal()],
      );
    }
  }, [open, goals]);

  const validation = validateGoalSheet(draftGoals);
  const inputsDisabled = isLocked;
  const submitLocked = inputsDisabled || !validation.canSubmit;

  const updateGoal = (id: string, patch: Partial<Goal>) => {
    setDraftGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)),
    );
  };

  const addRow = () => {
    if (draftGoals.length >= MAX_GOALS) return;
    setDraftGoals((prev) => [...prev, createEmptyGoal()]);
  };

  const removeRow = (id: string) => {
    if (draftGoals.length <= 1) return;
    setDraftGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const handleSubmit = () => {
    if (submitLocked) return;

    onSubmit(draftGoals);
    toast.success("Goal sheet submitted successfully.");
    setOpen(false);
  };

  const defaultTrigger = (
    <Button disabled={isLocked} className="hover:text-primary-foreground">
      Create New Goal Sheet
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={isLocked}>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        showCloseButton={!inputsDisabled}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Create New Goal Sheet</DialogTitle>
          <DialogDescription>
            Add up to {MAX_GOALS} goals with at least {MIN_WEIGHTAGE}% weightage
            each. Total weightage must equal exactly {REQUIRED_TOTAL}%.
          </DialogDescription>
          {isLocked ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <LockIcon className="size-3.5" />
              This goal sheet is locked. All fields are read-only.
            </p>
          ) : null}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Goal Title</TableHead>
                <TableHead className="min-w-[220px]">Targets</TableHead>
                <TableHead className="w-28">Weightage (%)</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {draftGoals.map((goal) => {
                const isShared = Boolean(goal.shared_from_id);
                const fieldLocked = inputsDisabled || isShared;
                const weightInvalid =
                  !Number.isFinite(goal.weightage) ||
                  goal.weightage < MIN_WEIGHTAGE;

                return (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <Input
                        value={goal.title}
                        onChange={(e) =>
                          updateGoal(goal.id, { title: e.target.value })
                        }
                        placeholder="Goal title"
                        disabled={fieldLocked}
                        readOnly={isShared}
                        aria-label="Goal title"
                        aria-invalid={!goal.title.trim()}
                      />
                      {isShared ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Shared goal — title is read-only
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <textarea
                        value={goal.targets}
                        onChange={(e) =>
                          updateGoal(goal.id, { targets: e.target.value })
                        }
                        placeholder="Measurable targets"
                        disabled={fieldLocked}
                        readOnly={isShared}
                        rows={2}
                        className={cn(
                          "flex min-h-16 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:text-foreground disabled:opacity-50 dark:bg-input/30",
                        )}
                        aria-label="Targets"
                        aria-invalid={!goal.targets.trim()}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={MIN_WEIGHTAGE}
                        max={100}
                        step={1}
                        value={goal.weightage}
                        onChange={(e) =>
                          updateGoal(goal.id, {
                            weightage: parseWeightageInput(e.target.value),
                          })
                        }
                        disabled={inputsDisabled}
                        aria-label="Weightage"
                        aria-invalid={weightInvalid}
                        className={cn(weightInvalid && "border-destructive/60")}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRow(goal.id)}
                        disabled={
                          inputsDisabled ||
                          draftGoals.length <= 1 ||
                          Boolean(goal.shared_from_id)
                        }
                        className="text-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Remove goal"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={inputsDisabled || draftGoals.length >= MAX_GOALS}
              className="hover:bg-muted hover:text-foreground"
            >
              <PlusIcon className="size-4" />
              Add goal row
            </Button>
            <p
              className={cn(
                "text-sm font-medium tabular-nums",
                validation.totalIs100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              Total: {validation.totalWeightage}% / {REQUIRED_TOTAL}%
            </p>
          </div>

          <ul className="mt-4 space-y-1 text-xs" role="list">
            {validation.errors.map((message) => (
              <li key={message} className="text-destructive">
                {message}
              </li>
            ))}
            {validation.canSubmit ? (
              <li className="text-emerald-600 dark:text-emerald-400">
                All hackathon rules satisfied — ready to submit.
              </li>
            ) : null}
          </ul>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="hover:bg-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitLocked}
            className="hover:text-primary-foreground disabled:opacity-50"
            title={
              submitLocked
                ? validation.errors[0] ?? "Complete all rules before submitting"
                : undefined
            }
          >
            Submit Goal Sheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
