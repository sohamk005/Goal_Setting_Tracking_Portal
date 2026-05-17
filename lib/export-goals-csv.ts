import type { EmployeeGoal } from "@/types/manager";

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildGoalsCsv(goals: EmployeeGoal[]): string {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Goal ID",
    "Title",
    "Targets",
    "Target Value",
    "Weightage (%)",
    "Thrust Area",
    "Metric Type",
    "Locked",
    "Review Status",
    "Manager ID",
  ];

  const rows = goals.map((g) =>
    [
      g.employee_id,
      g.employee_name,
      g.id,
      g.title,
      g.targets,
      g.target_value,
      g.weightage,
      g.thrust_area ?? "",
      g.metric_type,
      g.is_locked,
      g.review_status,
      g.manager_id,
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export function downloadGoalsCsv(goals: EmployeeGoal[], filename?: string) {
  const csv = buildGoalsCsv(goals);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ??
    `atomquest-goals-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
