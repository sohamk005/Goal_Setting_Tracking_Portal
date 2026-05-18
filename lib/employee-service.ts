import type { Goal, GoalStatus, Quarter } from "@/types/goal";
import type {
  EmployeeGoal,
  QuarterlyCheckIn,
} from "@/types/manager";
import { supabase } from "@/utils/supabase";

// ---------------------------------------------------------------
// Fetch goals for a specific employee
// ---------------------------------------------------------------
export async function fetchMyGoals(
  employeeId: string,
): Promise<EmployeeGoal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapGoalRow);
}

// ---------------------------------------------------------------
// Submit a goal sheet — upserts all goals in one batch
// ---------------------------------------------------------------
export async function submitGoalSheet(
  goals: Goal[],
  employeeId: string,
  employeeName: string,
  managerId: string,
): Promise<void> {
  const rows = goals.map((g) => ({
    id: g.id.startsWith("new-") ? undefined : g.id,
    employee_id: employeeId,
    employee_name: employeeName,
    manager_id: managerId,
    title: g.title.trim(),
    targets: g.targets.trim(),
    thrust_area: g.thrust_area,
    uom_type: g.uom_type,
    target_value: g.target_value,
    weightage: g.weightage,
    metric_type: uomToMetricType(g.uom_type),
    status: g.status ?? "not_started",
    quarter: g.quarter ?? "Q1",
    shared_from_id: g.shared_from_id ?? null,
    is_locked: false,
    review_status: "pending",
  }));

  const { error } = await supabase.from("goals").upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) throw error;
}

// ---------------------------------------------------------------
// Delete a single goal
// ---------------------------------------------------------------
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId);

  if (error) throw error;
}

// ---------------------------------------------------------------
// Update goal status (employee quarterly update)
// ---------------------------------------------------------------
export async function updateGoalStatus(
  goalId: string,
  status: GoalStatus,
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ status })
    .eq("id", goalId);

  if (error) throw error;
}

// ---------------------------------------------------------------
// Fetch quarterly check-ins for an employee
// ---------------------------------------------------------------
export async function fetchMyCheckIns(
  employeeId: string,
  quarter?: Quarter,
): Promise<QuarterlyCheckIn[]> {
  let query = supabase
    .from("goal_checkins")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: true });

  if (quarter) {
    query = query.eq("quarter", quarter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapCheckInRow);
}

// ---------------------------------------------------------------
// Upsert a check-in entry (employee logs achievement)
// ---------------------------------------------------------------
export async function saveMyCheckIn(
  checkIn: QuarterlyCheckIn & { quarter?: Quarter },
): Promise<void> {
  const { error } = await supabase.from("goal_checkins").upsert(
    {
      id: checkIn.id,
      goal_id: checkIn.goal_id,
      employee_id: checkIn.employee_id,
      employee_name: checkIn.employee_name,
      goal_title: checkIn.goal_title,
      planned_target: checkIn.planned_target,
      actual_achievement: checkIn.actual_achievement,
      metric_type: checkIn.metric_type,
      timeline_status: checkIn.timeline_status,
      manager_comment: checkIn.manager_comment,
      quarter: checkIn.quarter ?? "Q1",
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function uomToMetricType(uom: string): string {
  switch (uom) {
    case "percent":
      return "min";
    case "timeline":
      return "timeline";
    case "zero":
      return "zero";
    default:
      return "min";
  }
}

function mapGoalRow(row: Record<string, unknown>): EmployeeGoal {
  return {
    id: String(row.id),
    employee_id: String(row.employee_id),
    employee_name: String(row.employee_name ?? "Unknown"),
    manager_id: String(row.manager_id ?? ""),
    title: String(row.title ?? ""),
    targets: String(row.targets ?? ""),
    target_value: Number(row.target_value ?? 0),
    weightage: Number(row.weightage ?? 0),
    is_locked: Boolean(row.is_locked),
    review_status:
      (row.review_status as EmployeeGoal["review_status"]) ?? "pending",
    metric_type:
      (row.metric_type as EmployeeGoal["metric_type"]) ?? "min",
    thrust_area: row.thrust_area ? String(row.thrust_area) : "Unassigned",
    uom_type: (row.uom_type as EmployeeGoal["uom_type"]) ?? "numeric",
    status: (row.status as EmployeeGoal["status"]) ?? "not_started",
    quarter: (row.quarter as EmployeeGoal["quarter"]) ?? "Q1",
  };
}

function mapCheckInRow(row: Record<string, unknown>): QuarterlyCheckIn {
  return {
    id: String(row.id),
    goal_id: String(row.goal_id),
    employee_id: String(row.employee_id),
    employee_name: String(row.employee_name ?? "Unknown"),
    goal_title: String(row.goal_title ?? ""),
    planned_target: Number(row.planned_target ?? 0),
    actual_achievement: Number(row.actual_achievement ?? 0),
    metric_type:
      (row.metric_type as QuarterlyCheckIn["metric_type"]) ?? "min",
    timeline_status:
      (row.timeline_status as QuarterlyCheckIn["timeline_status"]) ??
      "on_time",
    manager_comment: String(row.manager_comment ?? ""),
  };
}
