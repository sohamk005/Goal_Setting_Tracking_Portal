export type MetricType = "min" | "max" | "timeline" | "zero";

export type TimelineStatus = "on_time" | "delayed" | "missed";

export type GoalReviewStatus = "pending" | "approved" | "rework";

export interface EmployeeGoal {
  id: string;
  employee_id: string;
  employee_name: string;
  manager_id: string;
  title: string;
  targets: string;
  target_value: number;
  weightage: number;
  is_locked: boolean;
  review_status: GoalReviewStatus;
  metric_type: MetricType;
  thrust_area?: string;
}

export interface QuarterlyCheckIn {
  id: string;
  goal_id: string;
  employee_id: string;
  employee_name: string;
  goal_title: string;
  planned_target: number;
  actual_achievement: number;
  metric_type: MetricType;
  timeline_status: TimelineStatus;
  manager_comment: string;
}

export interface EmployeeGoalGroup {
  employee_id: string;
  employee_name: string;
  goals: EmployeeGoal[];
}
