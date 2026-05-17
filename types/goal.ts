export interface Goal {
  id: string;
  title: string;
  targets: string;
  weightage: number;
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

function isGoalComplete(goal: Goal): boolean {
  return goal.title.trim().length > 0 && goal.targets.trim().length > 0;
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
    errors.push("Every goal must have a title and measurable targets.");
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
