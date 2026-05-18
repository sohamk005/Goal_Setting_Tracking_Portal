import type {
  EmployeeGoal,
  GoalReviewStatus,
  QuarterlyCheckIn,
  TimelineStatus,
} from "@/types/manager";
import { supabase } from "@/utils/supabase";

// ---------------------------------------------------------------
// Map DB rows to typed objects
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
    review_status: (row.review_status as GoalReviewStatus) ?? "pending",
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
    goal_title: String(row.goal_title ?? row.title ?? ""),
    planned_target: Number(row.planned_target ?? 0),
    actual_achievement: Number(row.actual_achievement ?? 0),
    metric_type:
      (row.metric_type as QuarterlyCheckIn["metric_type"]) ?? "min",
    timeline_status:
      (row.timeline_status as TimelineStatus) ?? "on_time",
    manager_comment: String(row.manager_comment ?? ""),
  };
}

// ---------------------------------------------------------------
// Fetch all goals for a manager's team
// ---------------------------------------------------------------
export async function fetchGoalsForManager(
  managerId: string,
): Promise<EmployeeGoal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("manager_id", managerId)
    .order("employee_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapGoalRow);
}

// ---------------------------------------------------------------
// Fetch quarterly check-ins for a manager's team
// ---------------------------------------------------------------
export async function fetchQuarterlyCheckIns(
  managerId: string,
): Promise<QuarterlyCheckIn[]> {
  const { data, error } = await supabase
    .from("goal_checkins")
    .select(
      "*, goals!inner(manager_id, title, employee_id, employee_name, metric_type)",
    )
    .eq("goals.manager_id", managerId);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const goal = row.goals as Record<string, unknown> | undefined;
    return mapCheckInRow({
      ...row,
      goal_title: goal?.title,
      employee_id: goal?.employee_id ?? row.employee_id,
      employee_name: goal?.employee_name ?? row.employee_name,
      metric_type: goal?.metric_type ?? row.metric_type,
    });
  });
}

// ---------------------------------------------------------------
// Update individual goal fields (manager inline edit)
// ---------------------------------------------------------------
export async function updateGoalFields(
  goalId: string,
  patch: Pick<EmployeeGoal, "targets" | "target_value" | "weightage">,
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({
      targets: patch.targets,
      target_value: patch.target_value,
      weightage: patch.weightage,
    })
    .eq("id", goalId);

  if (error) throw error;
}

// ---------------------------------------------------------------
// Approve and lock all goals for an employee
// ---------------------------------------------------------------
export async function approveAndLockEmployeeGoals(
  employeeId: string,
  managerId: string,
  goals: EmployeeGoal[],
): Promise<void> {
  const employeeGoalIds = goals
    .filter(
      (g) => g.employee_id === employeeId && g.manager_id === managerId,
    )
    .map((g) => g.id);

  // Apply any pending inline edits first
  const updates = goals
    .filter((g) => employeeGoalIds.includes(g.id))
    .map((g) =>
      updateGoalFields(g.id, {
        targets: g.targets,
        target_value: g.target_value,
        weightage: g.weightage,
      }),
    );

  await Promise.all(updates);

  // Lock + approve
  const { error } = await supabase
    .from("goals")
    .update({ is_locked: true, review_status: "approved" })
    .eq("employee_id", employeeId)
    .eq("manager_id", managerId);

  if (error) throw error;

  // Write audit log
  await supabase.from("audit_logs").insert({
    table_name: "goals",
    record_id: employeeId,
    action: "APPROVE",
    old_values: { review_status: "pending" },
    new_values: { review_status: "approved", is_locked: true },
    changed_by: "Manager",
  });
}

// ---------------------------------------------------------------
// Return goals for rework
// ---------------------------------------------------------------
export async function returnGoalsForRework(
  employeeId: string,
  managerId: string,
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ is_locked: false, review_status: "rework" })
    .eq("employee_id", employeeId)
    .eq("manager_id", managerId);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    table_name: "goals",
    record_id: employeeId,
    action: "REWORK",
    old_values: { review_status: "pending" },
    new_values: { review_status: "rework", is_locked: false },
    changed_by: "Manager",
  });
}

// ---------------------------------------------------------------
// Save quarterly check-in (manager adds comment)
// ---------------------------------------------------------------
export async function saveQuarterlyCheckIn(
  checkIn: QuarterlyCheckIn,
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
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}
