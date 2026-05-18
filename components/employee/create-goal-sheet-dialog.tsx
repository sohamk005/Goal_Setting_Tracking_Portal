"use client";

import { useEffect, useState } from "react";
import { Loader2Icon, LockIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
  THRUST_AREAS,
  UOM_LABELS,
  validateGoalSheet,
  type Goal,
  type GoalStatus,
  type Quarter,
  type UomType,
} from "@/types/goal";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4", "Annual"];
const STATUSES: { value: GoalStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "on_track", label: "On Track" },
  { value: "completed", label: "Completed" },
];

function createEmptyGoal(): Goal {
  return {
    id: `new-${crypto.randomUUID()}`,
    title: "",
    targets: "",
    thrust_area: "",
    uom_type: "numeric",
    target_value: 0,
    weightage: MIN_WEIGHTAGE,
    status: "not_started",
    quarter: "Q1",
  };
}

function parseNumber(raw: string): number {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface CreateGoalSheetDialogProps {
  goals: Goal[];
  isLocked: boolean;
  onSubmit: (goals: Goal[]) => Promise<void>;
  saving?: boolean;
  trigger?: React.ReactNode;
}

export function CreateGoalSheetDialog({
  goals,
  isLocked,
  onSubmit,
  saving = false,
  trigger,
}: CreateGoalSheetDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftGoals, setDraftGoals] = useState<Goal[]>([createEmptyGoal()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftGoals(
        goals.length > 0 ? goals.map((g) => ({ ...g })) : [createEmptyGoal()],
      );
    }
  }, [open, goals]);

  const validation = validateGoalSheet(draftGoals);
  const inputsDisabled = isLocked || submitting || saving;
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

  const handleSubmit = async () => {
    if (submitLocked) return;
    setSubmitting(true);
    try {
      await onSubmit(draftGoals);
      toast.success("Goal sheet submitted successfully.");
      setOpen(false);
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button disabled={isLocked} className="hover:text-primary-foreground">
      {goals.length > 0 ? "Edit Goal Sheet" : "Create New Goal Sheet"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={isLocked}>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={!inputsDisabled}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>
            {goals.length > 0 ? "Edit Goal Sheet" : "Create Goal Sheet"}
          </DialogTitle>
          <DialogDescription>
            Add up to {MAX_GOALS} goals with at least {MIN_WEIGHTAGE}% weightage
            each. Total must equal exactly {REQUIRED_TOTAL}%. Set Thrust Area
            and Unit of Measurement (UoM) for each goal.
          </DialogDescription>
          {isLocked ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <LockIcon className="size-3.5" />
              This goal sheet is locked. All fields are read-only.
            </p>
          ) : null}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Goal Title *</TableHead>
                  <TableHead className="min-w-[200px]">
                    Targets / Description *
                  </TableHead>
                  <TableHead className="min-w-[160px]">Thrust Area *</TableHead>
                  <TableHead className="min-w-[140px]">UoM Type *</TableHead>
                  <TableHead className="w-24">Target Value</TableHead>
                  <TableHead className="w-24">Quarter</TableHead>
                  <TableHead className="w-28">Weightage (%) *</TableHead>
                  <TableHead className="w-28">Status</TableHead>
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
                      {/* Title */}
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
                          className="text-sm"
                        />
                        {isShared ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Shared — read-only
                          </p>
                        ) : null}
                      </TableCell>

                      {/* Targets */}
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
                            "flex min-h-14 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
                          )}
                          aria-label="Targets"
                        />
                      </TableCell>

                      {/* Thrust Area */}
                      <TableCell>
                        <select
                          value={goal.thrust_area}
                          onChange={(e) =>
                            updateGoal(goal.id, {
                              thrust_area: e.target.value,
                            })
                          }
                          disabled={fieldLocked}
                          aria-label="Thrust area"
                          className={cn(
                            "flex h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm text-foreground shadow-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            !goal.thrust_area && "text-muted-foreground",
                          )}
                        >
                          <option value="">Select…</option>
                          {THRUST_AREAS.map((area) => (
                            <option key={area} value={area}>
                              {area}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* UoM Type */}
                      <TableCell>
                        <select
                          value={goal.uom_type}
                          onChange={(e) =>
                            updateGoal(goal.id, {
                              uom_type: e.target.value as UomType,
                            })
                          }
                          disabled={inputsDisabled}
                          aria-label="UoM type"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm text-foreground shadow-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {(
                            Object.entries(UOM_LABELS) as [UomType, string][]
                          ).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* Target Value */}
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={goal.target_value}
                          onChange={(e) =>
                            updateGoal(goal.id, {
                              target_value: parseNumber(e.target.value),
                            })
                          }
                          disabled={inputsDisabled}
                          aria-label="Target value"
                          className="text-sm"
                        />
                      </TableCell>

                      {/* Quarter */}
                      <TableCell>
                        <select
                          value={goal.quarter ?? "Q1"}
                          onChange={(e) =>
                            updateGoal(goal.id, {
                              quarter: e.target.value as Quarter,
                            })
                          }
                          disabled={inputsDisabled}
                          aria-label="Quarter"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm text-foreground shadow-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {QUARTERS.map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* Weightage */}
                      <TableCell>
                        <Input
                          type="number"
                          min={MIN_WEIGHTAGE}
                          max={100}
                          step={1}
                          value={goal.weightage}
                          onChange={(e) =>
                            updateGoal(goal.id, {
                              weightage: parseNumber(e.target.value),
                            })
                          }
                          disabled={inputsDisabled}
                          aria-label="Weightage"
                          aria-invalid={weightInvalid}
                          className={cn(
                            "text-sm",
                            weightInvalid && "border-destructive/60",
                          )}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <select
                          value={goal.status ?? "not_started"}
                          onChange={(e) =>
                            updateGoal(goal.id, {
                              status: e.target.value as GoalStatus,
                            })
                          }
                          disabled={inputsDisabled}
                          aria-label="Status"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm text-foreground shadow-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* Remove */}
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
          </div>

          {/* Footer controls */}
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

          {/* Validation messages */}
          <ul className="mt-4 space-y-1 text-xs" role="list">
            {validation.errors.map((message) => (
              <li key={message} className="text-destructive">
                {message}
              </li>
            ))}
            {validation.canSubmit ? (
              <li className="text-emerald-600 dark:text-emerald-400">
                All rules satisfied — ready to submit.
              </li>
            ) : null}
          </ul>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
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
                ? (validation.errors[0] ?? "Complete all rules before submitting")
                : undefined
            }
          >
            {submitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Submit Goal Sheet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
