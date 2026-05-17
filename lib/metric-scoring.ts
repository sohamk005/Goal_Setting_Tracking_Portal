import type { MetricType, TimelineStatus } from "@/types/manager";

/** Coerces unknown numeric input to a finite non-negative number. */
export function sanitizeMetricValue(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}

/**
 * BRD metric scoring (0–100).
 * - min: (achievement / target) × 100 — higher achievement vs target is better
 * - max: (target / achievement) × 100 — lower achievement vs target is better (inverted)
 */
export function calculateMetricScore(
  metricType: MetricType,
  target: number,
  achievement: number,
  timelineStatus: TimelineStatus = "on_time",
): number {
  const planned = sanitizeMetricValue(target);
  const actual = sanitizeMetricValue(achievement);

  switch (metricType) {
    case "min": {
      if (planned <= 0) return 0;
      return clampScore((actual / planned) * 100);
    }
    case "max": {
      if (actual <= 0) return 0;
      return clampScore((planned / actual) * 100);
    }
    case "timeline":
      if (timelineStatus === "on_time") return 100;
      if (timelineStatus === "delayed") return 50;
      return 0;
    case "zero":
      return actual === 0 ? 100 : 0;
    default:
      return 0;
  }
}

export function formatMetricScore(score: number): string {
  if (!Number.isFinite(score)) return "—";
  return `${Math.round(score * 100) / 100}%`;
}
