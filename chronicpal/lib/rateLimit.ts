import { MAX_DAILY_DIET_ANALYSES, MAX_DAILY_SUMMARIES } from '@/lib/constants';

// In-memory stores. Key format: "userId:YYYY-MM-DD"
const dietStore = new Map<string, number>();
const summaryStore = new Map<string, number>();

/**
 * Checks and increments the per-user daily diet analysis counter.
 * Returns allowed=false once the user has reached MAX_DAILY_DIET_ANALYSES.
 */
export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const count = dietStore.get(key) ?? 0;
  if (count >= MAX_DAILY_DIET_ANALYSES) {
    return { allowed: false, remaining: 0 };
  }
  dietStore.set(key, count + 1);
  return { allowed: true, remaining: MAX_DAILY_DIET_ANALYSES - count - 1 };
}

/**
 * Checks and increments the per-user daily summary generation counter.
 * Returns allowed=false once the user has reached MAX_DAILY_SUMMARIES.
 */
export function checkSummaryRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const count = summaryStore.get(key) ?? 0;
  if (count >= MAX_DAILY_SUMMARIES) {
    return { allowed: false, remaining: 0 };
  }
  summaryStore.set(key, count + 1);
  return { allowed: true, remaining: MAX_DAILY_SUMMARIES - count - 1 };
}
