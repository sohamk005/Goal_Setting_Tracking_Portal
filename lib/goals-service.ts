import { MOCK_USERS } from "@/context/UserContext";
import type {
  EmployeeGoal,
  GoalReviewStatus,
  QuarterlyCheckIn,
  TimelineStatus,
} from "@/types/manager";
import { supabase } from "@/utils/supabase";

const MOCK_GOALS: EmployeeGoal[] = [
  {
    id: "g1",
    employee_id: MOCK_USERS.employee.id,
    employee_name: MOCK_USERS.employee.name,
    manager_id: MOCK_USERS.manager.id,
    title: "Increase pipeline conversion",
    targets: "Lift qualified lead-to-opportunity rate from 18% to 25% by Q4.",
    target_value: 25,
    weightage: 35,
    is_locked: false,
    review_status: "pending",
    metric_type: "min",
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
    is_locked: false,
    review_status: "pending",
    metric_type: "max",
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
    is_locked: false,
    review_status: "rework",
    metric_type: "timeline",
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
  },
];

const MOCK_CHECKINS: QuarterlyCheckIn[] = MOCK_GOALS.map((goal) => ({
  id: `checkin-${goal.id}`,
  goal_id: goal.id,
  employee_id: goal.employee_id,
  employee_name: goal.employee_name,
  goal_title: goal.title,
  planned_target: goal.target_value,
  actual_achievement:
    goal.metric_type === "zero" ? 0 : Math.round(goal.target_value * 0.85),
  metric_type: goal.metric_type,
  timeline_status: "on_time" as TimelineStatus,
  manager_comment: "",
}));

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

export async function fetchGoalsForManager(
  managerId: string,
): Promise<{ goals: EmployeeGoal[]; fromMock: boolean }> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("manager_id", managerId)
    .order("employee_name", { ascending: true });

  if (error || !data?.length) {
    return {
      goals: MOCK_GOALS.filter((g) => g.manager_id === managerId),
      fromMock: true,
    };
  }

  return { goals: data.map(mapGoalRow), fromMock: false };
}

export async function fetchQuarterlyCheckIns(
  managerId: string,
): Promise<{ checkIns: QuarterlyCheckIn[]; fromMock: boolean }> {
  const { data, error } = await supabase
    .from("goal_checkins")
    .select("*, goals!inner(manager_id, title, employee_id, employee_name, metric_type)")
    .eq("goals.manager_id", managerId);

  if (error || !data?.length) {
    const goals = MOCK_GOALS.filter((g) => g.manager_id === managerId);
    return {
      checkIns: MOCK_CHECKINS.filter((c) =>
        goals.some((g) => g.id === c.goal_id),
      ),
      fromMock: true,
    };
  }

  return {
    checkIns: data.map((row) => {
      const goals = row.goals as Record<string, unknown> | undefined;
      return mapCheckInRow({
        ...row,
        goal_title: goals?.title,
        employee_id: goals?.employee_id ?? row.employee_id,
        employee_name: goals?.employee_name ?? row.employee_name,
        metric_type: goals?.metric_type ?? row.metric_type,
      });
    }),
    fromMock: false,
  };
}

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

export async function approveAndLockEmployeeGoals(
  employeeId: string,
  managerId: string,
  goals: EmployeeGoal[],
): Promise<void> {
  const employeeGoalIds = goals
    .filter((g) => g.employee_id === employeeId && g.manager_id === managerId)
    .map((g) => g.id);

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

  const { error } = await supabase
    .from("goals")
    .update({ is_locked: true, review_status: "approved" })
    .eq("employee_id", employeeId)
    .eq("manager_id", managerId);

  if (error) throw error;
}

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
}

export async function saveQuarterlyCheckIn(
  checkIn: QuarterlyCheckIn,
): Promise<void> {
  const { error } = await supabase.from("goal_checkins").upsert({
    id: checkIn.id,
    goal_id: checkIn.goal_id,
    employee_id: checkIn.employee_id,
    planned_target: checkIn.planned_target,
    actual_achievement: checkIn.actual_achievement,
    metric_type: checkIn.metric_type,
    timeline_status: checkIn.timeline_status,
    manager_comment: checkIn.manager_comment,
  });

  if (error) throw error;
}
