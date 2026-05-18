import { calculateMetricScore } from "@/lib/metric-scoring";
import type { AuditLog } from "@/types/admin";
import type { EmployeeGoal, QuarterlyCheckIn } from "@/types/manager";
import { supabase } from "@/utils/supabase";

// ---------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------
function mapGoalRow(row: Record<string, unknown>): EmployeeGoal {
  return {
    id: String(row.id),
    employee_id: String(row.employee_id),
    employee_name: String(row.employee_name ?? "Unknown"),
    manager_id: String(row.manager_id),
    title: String(row.title ?? ""),
    targets: String(row.targets ?? ""),
    target_value: Number(row.target_value ?? 0),
    weightage: Number(row.weightage ?? 0),
    is_locked: Boolean(row.is_locked),
    review_status:
      (row.review_status as EmployeeGoal["review_status"]) ?? "pending",
    metric_type: (row.metric_type as EmployeeGoal["metric_type"]) ?? "min",
    thrust_area: row.thrust_area ? String(row.thrust_area) : "Unassigned",
    uom_type: (row.uom_type as EmployeeGoal["uom_type"]) ?? "numeric",
    status: (row.status as EmployeeGoal["status"]) ?? "not_started",
    quarter: (row.quarter as EmployeeGoal["quarter"]) ?? "Q1",
  };
}

function mapAuditRow(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    table_name: String(row.table_name ?? ""),
    record_id: String(row.record_id ?? ""),
    action: String(row.action ?? ""),
    old_values: (row.old_values as Record<string, unknown>) ?? null,
    new_values: (row.new_values as Record<string, unknown>) ?? null,
    changed_by: row.changed_by ? String(row.changed_by) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------
// Fetch all goals (admin view)
// ---------------------------------------------------------------
export async function fetchAllGoals(): Promise<EmployeeGoal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("employee_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapGoalRow);
}

// ---------------------------------------------------------------
// Fetch locked goals (for force-unlock panel)
// ---------------------------------------------------------------
export async function fetchLockedGoals(): Promise<EmployeeGoal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("is_locked", true)
    .order("employee_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapGoalRow);
}

// ---------------------------------------------------------------
// Force-unlock a goal (admin override)
// ---------------------------------------------------------------
export async function forceUnlockGoal(goalId: string): Promise<void> {
  // Fetch current state for audit
  const { data: current } = await supabase
    .from("goals")
    .select("is_locked, review_status")
    .eq("id", goalId)
    .single();

  const { error } = await supabase
    .from("goals")
    .update({ is_locked: false })
    .eq("id", goalId);

  if (error) throw error;

  // Audit log
  await supabase.from("audit_logs").insert({
    table_name: "goals",
    record_id: goalId,
    action: "FORCE_UNLOCK",
    old_values: current ?? { is_locked: true },
    new_values: { is_locked: false },
    changed_by: "Admin",
  });
}

// ---------------------------------------------------------------
// Fetch audit logs
// ---------------------------------------------------------------
export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map(mapAuditRow);
}

// ---------------------------------------------------------------
// Fetch check-ins for analytics
// ---------------------------------------------------------------
export async function fetchCheckInsForAnalytics(): Promise<QuarterlyCheckIn[]> {
  const { data, error } = await supabase
    .from("goal_checkins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    goal_id: String(row.goal_id),
    employee_id: String(row.employee_id),
    employee_name: String(row.employee_name ?? "Unknown"),
    goal_title: String(row.goal_title ?? ""),
    planned_target: Number(row.planned_target ?? 0),
    actual_achievement: Number(row.actual_achievement ?? 0),
    metric_type: (row.metric_type ?? "min") as QuarterlyCheckIn["metric_type"],
    timeline_status:
      (row.timeline_status ?? "on_time") as QuarterlyCheckIn["timeline_status"],
    manager_comment: String(row.manager_comment ?? ""),
  }));
}

// ---------------------------------------------------------------
// Analytics aggregation helpers
// ---------------------------------------------------------------
export function aggregateThrustWeightage(goals: EmployeeGoal[]) {
  const totals = new Map<string, number>();

  for (const goal of goals) {
    const area = goal.thrust_area ?? "Unassigned";
    totals.set(area, (totals.get(area) ?? 0) + goal.weightage);
  }

  return Array.from(totals.entries()).map(([name, value]) => ({
    name,
    value,
  }));
}

export function aggregateCompletionByThrust(
  goals: EmployeeGoal[],
  checkIns: QuarterlyCheckIn[],
) {
  const scoresByThrust = new Map<string, number[]>();

  for (const checkIn of checkIns) {
    const goal = goals.find((g) => g.id === checkIn.goal_id);
    const thrust = goal?.thrust_area ?? "Unassigned";
    const score = calculateMetricScore(
      checkIn.metric_type,
      checkIn.planned_target,
      checkIn.actual_achievement,
      checkIn.timeline_status,
    );
    const list = scoresByThrust.get(thrust) ?? [];
    list.push(score);
    scoresByThrust.set(thrust, list);
  }

  return Array.from(scoresByThrust.entries()).map(([name, scores]) => ({
    name,
    avgIndex:
      Math.round(
        (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
      ) / 100,
  }));
}

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
