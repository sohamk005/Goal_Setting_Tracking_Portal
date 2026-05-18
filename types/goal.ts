export type UomType = "numeric" | "percent" | "timeline" | "zero";
export type GoalStatus = "not_started" | "on_track" | "completed";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4" | "Annual";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targets: string;
  thrust_area: string;
  uom_type: UomType;
  target_value: number;
  weightage: number;
  status?: GoalStatus;
  quarter?: Quarter;
  shared_from_id?: string | null;
}

export interface GoalSheet {
  is_locked: boolean;
  goals: Goal[];
}

export interface GoalSheetValidation {
  tooManyGoals: boolean;
  withinGoalLimit: boolean;
  eachWeightValid: boolean;
  allGoalsComplete: boolean;
  totalWeightage: number;
  totalIs100: boolean;
  canSubmit: boolean;
  errors: string[];
}

const MAX_GOALS = 8;
const MIN_WEIGHTAGE = 10;
const REQUIRED_TOTAL = 100;

export const THRUST_AREAS = [
  "Revenue Growth",
  "Customer Excellence",
  "Operational Excellence",
  "Strategic Partnerships",
  "People & Culture",
  "Innovation & Technology",
  "Compliance & Risk",
  "Other",
] as const;

export const UOM_LABELS: Record<UomType, string> = {
  numeric: "Numeric (Higher is better)",
  percent: "% (Higher is better)",
  timeline: "Timeline (Date-based)",
  zero: "Zero-based (0 = Success)",
};

// Map UoM type to the metric_type used in scoring
export const UOM_TO_METRIC: Record<UomType, string> = {
  numeric: "min",
  percent: "min",
  timeline: "timeline",
  zero: "zero",
};

function isGoalComplete(goal: Goal): boolean {
  return (
    goal.title.trim().length > 0 &&
    goal.targets.trim().length > 0 &&
    goal.thrust_area.trim().length > 0
  );
}

function isWeightageValid(weightage: number): boolean {
  return Number.isFinite(weightage) && weightage >= MIN_WEIGHTAGE;
}

export function validateGoalSheet(goals: Goal[]): GoalSheetValidation {
  const tooManyGoals = goals.length > MAX_GOALS;
  const withinGoalLimit = goals.length > 0 && goals.length <= MAX_GOALS;
  const eachWeightValid = goals.every((g) => isWeightageValid(g.weightage));
  const allGoalsComplete = goals.every(isGoalComplete);
  const totalWeightage = goals.reduce(
    (sum, g) => sum + (Number.isFinite(g.weightage) ? g.weightage : 0),
    0,
  );
  const totalIs100 = totalWeightage === REQUIRED_TOTAL;

  const errors: string[] = [];
  if (goals.length === 0) {
    errors.push("Add at least one goal before submitting.");
  }
  if (tooManyGoals) {
    errors.push(`You cannot submit more than ${MAX_GOALS} goals.`);
  }
  if (!allGoalsComplete) {
    errors.push(
      "Every goal must have a title, targets, and a thrust area selected.",
    );
  }
  if (!eachWeightValid) {
    errors.push(
      `Each goal must have a weightage of at least ${MIN_WEIGHTAGE}%.`,
    );
  }
  if (!totalIs100) {
    errors.push(
      `Aggregate weightage must equal exactly ${REQUIRED_TOTAL}% (currently ${totalWeightage}%).`,
    );
  }

  const canSubmit =
    withinGoalLimit &&
    !tooManyGoals &&
    eachWeightValid &&
    allGoalsComplete &&
    totalIs100;

  return {
    tooManyGoals,
    withinGoalLimit,
    eachWeightValid,
    allGoalsComplete,
    totalWeightage,
    totalIs100,
    canSubmit,
    errors,
  };
}

export { MAX_GOALS, MIN_WEIGHTAGE, REQUIRED_TOTAL };
