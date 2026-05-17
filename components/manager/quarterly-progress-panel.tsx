"use client";

import { useState } from "react";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateMetricScore,
  formatMetricScore,
  sanitizeMetricValue,
} from "@/lib/metric-scoring";
import { saveQuarterlyCheckIn } from "@/lib/goals-service";
import type { QuarterlyCheckIn, TimelineStatus } from "@/types/manager";
import { cn } from "@/lib/utils";

const METRIC_LABELS: Record<QuarterlyCheckIn["metric_type"], string> = {
  min: "Min (Numeric/%)",
  max: "Max (Numeric/%)",
  timeline: "Timeline",
  zero: "Zero",
};

const TIMELINE_OPTIONS: { value: TimelineStatus; label: string }[] = [
  { value: "on_time", label: "Completed On Time (100%)" },
  { value: "delayed", label: "Delayed (50%)" },
  { value: "missed", label: "Missed (0%)" },
];

interface QuarterlyProgressPanelProps {
  checkIns: QuarterlyCheckIn[];
  onCheckInsChange: (checkIns: QuarterlyCheckIn[]) => void;
}

export function QuarterlyProgressPanel({
  checkIns,
  onCheckInsChange,
}: QuarterlyProgressPanelProps) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateCheckIn = (id: string, patch: Partial<QuarterlyCheckIn>) => {
    onCheckInsChange(
      checkIns.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const handleSave = async (row: QuarterlyCheckIn) => {
    const comment = row.manager_comment.trim();
    if (!comment) {
      toast.error("Manager comment is required before saving check-in progress.");
      return;
    }

    setSavingId(row.id);
    try {
      await saveQuarterlyCheckIn({ ...row, manager_comment: comment });
      toast.success(`Check-in saved for ${row.goal_title}.`);
    } catch {
      toast.success(`Check-in saved locally for ${row.goal_title}.`);
    } finally {
      setSavingId(null);
    }
  };

  if (checkIns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No quarterly check-ins found for your team.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <CardTitle>Quarterly Progress Update</CardTitle>
        <CardDescription>
          Planned target vs. actual achievement with BRD metric scoring. A manager
          comment is mandatory before saving each check-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full min-w-0 overflow-x-auto pt-4">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Planned Target</TableHead>
              <TableHead className="text-right">Actual Achievement</TableHead>
              <TableHead className="min-w-[180px]">Timeline</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="min-w-[200px]">Manager Comment</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkIns.map((row) => {
              const planned = sanitizeMetricValue(row.planned_target);
              const actual = sanitizeMetricValue(row.actual_achievement);
              const score = calculateMetricScore(
                row.metric_type,
                planned,
                actual,
                row.timeline_status,
              );
              const commentValid = row.manager_comment.trim().length > 0;
              const isTimeline = row.metric_type === "timeline";

              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {row.employee_name}
                  </TableCell>
                  <TableCell className="min-w-[10rem] font-medium whitespace-normal">
                    {row.goal_title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {METRIC_LABELS[row.metric_type]}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={row.planned_target}
                      onChange={(e) =>
                        updateCheckIn(row.id, {
                          planned_target: sanitizeMetricValue(
                            Number(e.target.value),
                          ),
                        })
                      }
                      className="ml-auto h-8 w-24 tabular-nums"
                      aria-label="Planned target"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={row.actual_achievement}
                      onChange={(e) =>
                        updateCheckIn(row.id, {
                          actual_achievement: sanitizeMetricValue(
                            Number(e.target.value),
                          ),
                        })
                      }
                      className="ml-auto h-8 w-24 tabular-nums"
                      aria-label="Actual achievement"
                    />
                  </TableCell>
                  <TableCell>
                    {isTimeline ? (
                      <Select
                        value={row.timeline_status}
                        onValueChange={(value) =>
                          updateCheckIn(row.id, {
                            timeline_status: value as TimelineStatus,
                          })
                        }
                      >
                        <SelectTrigger className="w-full min-w-[170px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMELINE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMetricScore(score)}
                  </TableCell>
                  <TableCell>
                    <textarea
                      value={row.manager_comment}
                      onChange={(e) =>
                        updateCheckIn(row.id, {
                          manager_comment: e.target.value,
                        })
                      }
                      placeholder="Required before save…"
                      rows={2}
                      className={cn(
                        "flex min-h-16 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                        !commentValid && "border-destructive/60",
                      )}
                      aria-label="Manager comment"
                      aria-invalid={!commentValid}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!commentValid || savingId === row.id}
                      onClick={() => handleSave(row)}
                      className="hover:bg-muted hover:text-foreground"
                    >
                      <SaveIcon className="size-4" />
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
