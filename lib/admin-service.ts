import { MOCK_USERS } from "@/context/UserContext";
import { calculateMetricScore } from "@/lib/metric-scoring";
import type { AuditLog } from "@/types/admin";
import type { EmployeeGoal, QuarterlyCheckIn } from "@/types/manager";
import { supabase } from "@/utils/supabase";

const MOCK_ALL_GOALS: EmployeeGoal[] = [
  {
    id: "g1",
    employee_id: MOCK_USERS.employee.id,
    employee_name: MOCK_USERS.employee.name,
    manager_id: MOCK_USERS.manager.id,
    title: "Increase pipeline conversion",
    targets: "Lift qualified lead-to-opportunity rate from 18% to 25% by Q4.",
    target_value: 25,
    weightage: 35,
    is_locked: true,
    review_status: "approved",
    metric_type: "min",
    thrust_area: "Revenue Growth",
  },
  {
    id: "g2",
    employee_id: MOCK_USERS.employee.id,
    employee_name: MOCK_USERS.employee.name,
    manager_id: MOCK_USERS.manager.id,
    title: "Customer retention uplift",
    targets: "Reduce logo churn below 4% and improve NPS to 52+.",
    target_value: 52,
    weightage: 25,
    is_locked: true,
    review_status: "approved",
    metric_type: "max",
    thrust_area: "Customer Excellence",
  },
  {
    id: "g3",
    employee_id: MOCK_USERS.employee.id,
    employee_name: MOCK_USERS.employee.name,
    manager_id: MOCK_USERS.manager.id,
    title: "Enablement & documentation",
    targets: "Publish 6 playbooks and run 2 cross-team workshops.",
    target_value: 6,
    weightage: 20,
    is_locked: true,
    review_status: "approved",
    metric_type: "timeline",
    thrust_area: "Operational Excellence",
  },
  {
    id: "g4",
    employee_id: MOCK_USERS.employee.id,
    employee_name: MOCK_USERS.employee.name,
    manager_id: MOCK_USERS.manager.id,
    title: "Operational excellence",
    targets: "Cut cycle time on priority requests by 15%.",
    target_value: 15,
    weightage: 20,
    is_locked: true,
    review_status: "approved",
    metric_type: "zero",
    thrust_area: "Operational Excellence",
  },
  {
    id: "g5",
    employee_id: "e2222222-2222-2222-2222-222222222222",
    employee_name: "Priya Sharma",
    manager_id: MOCK_USERS.manager.id,
    title: "Enterprise upsell motion",
    targets: "Close 12 expansion deals above $50k ARR.",
    target_value: 12,
    weightage: 40,
    is_locked: true,
    review_status: "approved",
    metric_type: "min",
    thrust_area: "Revenue Growth",
  },
  {
    id: "g6",
    employee_id: "e2222222-2222-2222-2222-222222222222",
    employee_name: "Priya Sharma",
    manager_id: MOCK_USERS.manager.id,
    title: "Partner ecosystem",
    targets: "Onboard 5 strategic partners with joint GTM plans.",
    target_value: 5,
    weightage: 30,
    is_locked: false,
    review_status: "pending",
    metric_type: "timeline",
    thrust_area: "Strategic Partnerships",
  },
];

const MOCK_CHECKINS: QuarterlyCheckIn[] = [
  {
    id: "c1",
    goal_id: "g1",
    employee_id: MOCK_USERS.employee.id,
    employee_name: MOCK_USERS.employee.name,
    goal_title: "Increase pipeline conversion",
    planned_target: 25,
    actual_achievement: 22,
    metric_type: "min",
    timeline_status: "on_time",
    manager_comment: "Strong Q1 pipeline.",
  },
  {
    id: "c2",
    goal_id: "g2",
    employee_id: MOCK_USERS.employee.id,
    employee_name: MOCK_USERS.employee.name,
    goal_title: "Customer retention uplift",
    planned_target: 52,
    actual_achievement: 48,
    metric_type: "max",
    timeline_status: "on_time",
    manager_comment: "NPS trending up.",
  },
  {
    id: "c3",
    goal_id: "g5",
    employee_id: "e2222222-2222-2222-2222-222222222222",
    employee_name: "Priya Sharma",
    goal_title: "Enterprise upsell motion",
    planned_target: 12,
    actual_achievement: 9,
    metric_type: "min",
    timeline_status: "delayed",
    manager_comment: "Two deals slipped to Q2.",
  },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "a1",
    table_name: "goals",
    record_id: "g4",
    action: "UPDATE",
    old_values: { is_locked: false },
    new_values: { is_locked: true, review_status: "approved" },
    changed_by: MOCK_USERS.manager.name,
    created_at: "2026-05-10T14:22:00.000Z",
  },
  {
    id: "a2",
    table_name: "goals",
    record_id: "g1",
    action: "UPDATE",
    old_values: { weightage: 30 },
    new_values: { weightage: 35 },
    changed_by: MOCK_USERS.manager.name,
    created_at: "2026-05-12T09:15:00.000Z",
  },
  {
    id: "a3",
    table_name: "goal_checkins",
    record_id: "c1",
    action: "INSERT",
    old_values: null,
    new_values: { actual_achievement: 22, planned_target: 25 },
    changed_by: MOCK_USERS.manager.name,
    created_at: "2026-05-15T16:40:00.000Z",
  },
];

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

export async function fetchAllGoals(): Promise<{
  goals: EmployeeGoal[];
  fromMock: boolean;
}> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("employee_name", { ascending: true });

  if (error || !data?.length) {
    return { goals: MOCK_ALL_GOALS, fromMock: true };
  }

  return { goals: data.map(mapGoalRow), fromMock: false };
}

export async function fetchLockedGoals(): Promise<{
  goals: EmployeeGoal[];
  fromMock: boolean;
}> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("is_locked", true)
    .order("employee_name", { ascending: true });

  if (error || !data?.length) {
    return {
      goals: MOCK_ALL_GOALS.filter((g) => g.is_locked),
      fromMock: true,
    };
  }

  return { goals: data.map(mapGoalRow), fromMock: false };
}

export async function forceUnlockGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ is_locked: false })
    .eq("id", goalId);

  if (error) throw error;
}

export async function fetchAuditLogs(): Promise<{
  logs: AuditLog[];
  fromMock: boolean;
}> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data?.length) {
    return { logs: MOCK_AUDIT_LOGS, fromMock: true };
  }

  return { logs: data.map(mapAuditRow), fromMock: false };
}

export async function fetchCheckInsForAnalytics(): Promise<{
  checkIns: QuarterlyCheckIn[];
  fromMock: boolean;
}> {
  const { data, error } = await supabase.from("goal_checkins").select("*");

  if (error || !data?.length) {
    return { checkIns: MOCK_CHECKINS, fromMock: true };
  }

  return {
    checkIns: data.map((row) => ({
      id: String(row.id),
      goal_id: String(row.goal_id),
      employee_id: String(row.employee_id),
      employee_name: String(row.employee_name ?? "Unknown"),
      goal_title: String(row.goal_title ?? ""),
      planned_target: Number(row.planned_target ?? 0),
      actual_achievement: Number(row.actual_achievement ?? 0),
      metric_type: row.metric_type ?? "min",
      timeline_status: row.timeline_status ?? "on_time",
      manager_comment: String(row.manager_comment ?? ""),
    })),
    fromMock: false,
  };
}

export function aggregateThrustWeightage(goals: EmployeeGoal[]) {
  const totals = new Map<string, number>();

  for (const goal of goals) {
    const area = goal.thrust_area ?? "Unassigned";
    totals.set(area, (totals.get(area) ?? 0) + goal.weightage);
  }

  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
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
    avgIndex: Math.round(
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
